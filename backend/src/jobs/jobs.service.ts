import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job as BullJob, Queue, Worker } from "bullmq";
import { desc, eq } from "drizzle-orm";
import IORedis from "ioredis";
import { randomUUID } from "node:crypto";

import { DatabaseService } from "../database/database.service";
import { jobItems, jobs } from "../database/schema";
import { CreateJobDto } from "./dto/create-job.dto";

type JobState = "queued" | "running" | "completed" | "partial" | "failed" | "cancelled";
type JobItemState = "queued" | "running" | "completed" | "failed" | "skipped";

type MemoryJobItem = {
  id: string;
  jobId: string;
  domainName: string;
  status: JobItemState;
  step: string | null;
  attempt: number;
  error: string | null;
  result: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type MemoryJob = {
  id: string;
  type: string;
  status: JobState;
  payload: Record<string, unknown>;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: MemoryJobItem[];
};

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly memory = new Map<string, MemoryJob>();
  private connection: IORedis | null = null;
  private queue: Queue<CreateJobDto> | null = null;
  private worker: Worker<CreateJobDto> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
  ) {}

  get status(): "memory" | "connecting" | "ready" | "error" {
    if (!this.redisEnabled) return "memory";
    if (!this.connection) return "connecting";
    return this.connection.status === "ready" ? "ready" : this.connection.status === "end" ? "error" : "connecting";
  }

  private get redisEnabled() {
    return this.config.get<boolean>("REDIS_ENABLED", false);
  }

  async onModuleInit() {
    if (!this.redisEnabled) return;

    this.connection = new IORedis(this.config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<CreateJobDto>("domain-operations", {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: 500,
        removeOnFail: 1_000,
      },
    });
    this.worker = new Worker<CreateJobDto>(
      "domain-operations",
      async (job) => this.processQueuedJob(job),
      { connection: this.connection, concurrency: 3 },
    );
    this.worker.on("failed", (job, error) => {
      this.logger.error(`Job ${job?.id ?? "unknown"} failed: ${error.message}`);
    });
  }

  async list() {
    if (!this.database.enabled) {
      return [...this.memory.values()].sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
    }
    return this.database.requireDb().select().from(jobs).orderBy(desc(jobs.createdAt)).limit(100);
  }

  async get(id: string) {
    if (!this.database.enabled) {
      const record = this.memory.get(id);
      if (!record) throw new NotFoundException("Job not found");
      return record;
    }

    const record = (
      await this.database.requireDb().select().from(jobs).where(eq(jobs.id, id)).limit(1)
    )[0];
    if (!record) throw new NotFoundException("Job not found");
    const items = await this.database
      .requireDb()
      .select()
      .from(jobItems)
      .where(eq(jobItems.jobId, id));
    return { ...record, items };
  }

  async create(dto: CreateJobDto) {
    const normalized: CreateJobDto = {
      ...dto,
      domains: [...new Set(dto.domains.map((domain) => domain.trim().toLowerCase()))],
      options: dto.options ?? {},
    };
    const now = new Date();
    const id = randomUUID();
    const items: MemoryJobItem[] = normalized.domains.map((domainName) => ({
      id: randomUUID(),
      jobId: id,
      domainName,
      status: "queued",
      step: null,
      attempt: 0,
      error: null,
      result: {},
      createdAt: now,
      updatedAt: now,
    }));
    const record: MemoryJob = {
      id,
      type: normalized.type,
      status: "queued",
      payload: { options: normalized.options },
      totalItems: items.length,
      completedItems: 0,
      failedItems: 0,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      items,
    };

    if (this.database.enabled) {
      await this.database.requireDb().transaction(async (transaction) => {
        await transaction.insert(jobs).values({
          id,
          type: normalized.type,
          status: "queued",
          payload: { options: normalized.options },
          totalItems: items.length,
          createdAt: now,
          updatedAt: now,
        });
        await transaction.insert(jobItems).values(
          items.map((item) => ({
            id: item.id,
            jobId: id,
            domainName: item.domainName,
            status: "queued" as const,
            createdAt: now,
            updatedAt: now,
          })),
        );
      });
    } else {
      this.memory.set(id, record);
    }

    if (this.queue) {
      await this.queue.add(normalized.type, normalized, { jobId: id });
    } else {
      queueMicrotask(() => void this.processMockJob(id, normalized));
    }
    return record;
  }

  private async processQueuedJob(job: BullJob<CreateJobDto>) {
    if (this.config.get<string>("APP_MODE", "mock") !== "mock") {
      const message = "Live provider job handlers are not enabled yet";
      await this.failJob(String(job.id), message);
      throw new Error(message);
    }
    await this.processMockJob(String(job.id), job.data);
    return { completed: job.data.domains.length };
  }

  private async processMockJob(id: string, dto: CreateJobDto) {
    const startedAt = new Date();
    await this.updateJob(id, {
      status: "running",
      startedAt,
      updatedAt: startedAt,
    });
    await Promise.resolve();
    const completedAt = new Date();
    await this.completeItems(id, dto.type, completedAt);
    await this.updateJob(id, {
      status: "completed",
      completedItems: dto.domains.length,
      failedItems: 0,
      completedAt,
      updatedAt: completedAt,
    });
  }

  private async completeItems(id: string, operation: string, completedAt: Date) {
    if (this.database.enabled) {
      await this.database
        .requireDb()
        .update(jobItems)
        .set({
          status: "completed",
          step: "mock_completed",
          attempt: 1,
          result: { simulated: true, operation },
          startedAt: completedAt,
          completedAt,
          updatedAt: completedAt,
        })
        .where(eq(jobItems.jobId, id));
      return;
    }
    const job = this.memory.get(id);
    if (!job) return;
    job.items = job.items.map((item) => ({
      ...item,
      status: "completed",
      step: "mock_completed",
      attempt: 1,
      result: { simulated: true, operation },
      updatedAt: completedAt,
    }));
  }

  private async failJob(id: string, message: string) {
    const completedAt = new Date();
    if (this.database.enabled) {
      await this.database
        .requireDb()
        .update(jobItems)
        .set({ status: "failed", error: message, completedAt, updatedAt: completedAt })
        .where(eq(jobItems.jobId, id));
    } else {
      const job = this.memory.get(id);
      if (job) {
        job.items = job.items.map((item) => ({
          ...item,
          status: "failed",
          error: message,
          updatedAt: completedAt,
        }));
      }
    }
    await this.updateJob(id, {
      status: "failed",
      failedItems: (await this.get(id)).totalItems,
      completedAt,
      updatedAt: completedAt,
    });
  }

  private async updateJob(
    id: string,
    changes: Partial<Omit<MemoryJob, "id" | "items">>,
  ) {
    if (this.database.enabled) {
      await this.database.requireDb().update(jobs).set(changes).where(eq(jobs.id, id));
      return;
    }
    const current = this.memory.get(id);
    if (current) this.memory.set(id, { ...current, ...changes });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    this.connection?.disconnect();
  }
}
