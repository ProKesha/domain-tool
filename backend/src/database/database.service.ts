import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  db: NodePgDatabase<typeof schema> | null = null;
  status: "disabled" | "connecting" | "ready" | "error" = "disabled";

  constructor(private readonly config: ConfigService) {}

  get enabled() {
    return this.config.get<boolean>("DATABASE_ENABLED", false);
  }

  async onModuleInit() {
    if (!this.enabled) return;

    this.status = "connecting";
    this.pool = new Pool({
      connectionString: this.config.getOrThrow<string>("DATABASE_URL"),
      max: 10,
    });
    try {
      await this.pool.query("select 1");
      this.db = drizzle(this.pool, { schema });
      this.status = "ready";
    } catch (error) {
      this.status = "error";
      this.logger.error("PostgreSQL connection failed", error);
      throw error;
    }
  }

  requireDb() {
    if (!this.db) {
      throw new Error("Database is disabled. Enable DATABASE_ENABLED first.");
    }
    return this.db;
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
