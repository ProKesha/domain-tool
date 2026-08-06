import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { DatabaseService } from "../database/database.service";
import {
  NewProviderAccountRow,
  ProviderAccountRow,
  providerAccounts,
} from "../database/schema";
import { ProvidersService } from "../providers/providers.service";
import { ProviderCredentials } from "../providers/provider.types";
import { SecretsService } from "../security/secrets.service";
import { CreateProviderAccountDto, ProviderDtoType } from "./dto/create-provider-account.dto";

type StoredAccount = ProviderAccountRow;

@Injectable()
export class AccountsService {
  private readonly memory = new Map<string, StoredAccount>();

  constructor(
    private readonly database: DatabaseService,
    private readonly secrets: SecretsService,
    private readonly providers: ProvidersService,
  ) {}

  async list() {
    const accounts = this.database.enabled
      ? await this.database.requireDb().select().from(providerAccounts)
      : [...this.memory.values()];
    return accounts.map((account) => this.toPublic(account));
  }

  async create(dto: CreateProviderAccountDto) {
    this.validateProviderFields(dto);
    const secret =
      dto.provider === ProviderDtoType.Cloudflare ? dto.apiToken! : dto.apiKey!;
    const now = new Date();
    const row: NewProviderAccountRow = {
      id: randomUUID(),
      provider: dto.provider,
      label: dto.label.trim(),
      username: dto.username?.trim() ?? null,
      apiUser: dto.apiUser?.trim() ?? null,
      email: dto.email?.trim() ?? null,
      accountId: dto.accountId?.trim() ?? null,
      clientIp: dto.clientIp ?? null,
      encryptedSecret: this.secrets.encrypt(secret),
      status: "untested",
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    let created: StoredAccount;
    if (this.database.enabled) {
      [created] = await this.database
        .requireDb()
        .insert(providerAccounts)
        .values(row)
        .returning();
    } else {
      created = {
        ...row,
        status: "untested",
        lastTestedAt: null,
        lastError: null,
        createdAt: now,
        updatedAt: now,
      } as StoredAccount;
      this.memory.set(created.id, created);
    }
    return this.toPublic(created);
  }

  async test(id: string) {
    const account = await this.findStored(id);
    const secret = this.secrets.decrypt(account.encryptedSecret);
    const credentials: ProviderCredentials =
      account.provider === "cloudflare"
        ? {
            provider: "cloudflare",
            apiToken: secret,
            accountId: account.accountId ?? undefined,
          }
        : {
            provider: "namecheap",
            apiKey: secret,
            apiUser: account.apiUser!,
            username: account.username!,
            clientIp: account.clientIp!,
          };
    const result = await this.providers.testCredentials(credentials);
    const changes = {
      status: result.ok ? ("active" as const) : ("invalid" as const),
      lastTestedAt: new Date(),
      lastError: result.ok ? null : result.message,
      updatedAt: new Date(),
    };

    if (this.database.enabled) {
      await this.database
        .requireDb()
        .update(providerAccounts)
        .set(changes)
        .where(eq(providerAccounts.id, id));
    } else {
      this.memory.set(id, { ...account, ...changes });
    }
    return result;
  }

  async remove(id: string) {
    await this.findStored(id);
    if (this.database.enabled) {
      await this.database
        .requireDb()
        .delete(providerAccounts)
        .where(eq(providerAccounts.id, id));
    } else {
      this.memory.delete(id);
    }
    return { deleted: true, id };
  }

  private async findStored(id: string) {
    const account = this.database.enabled
      ? (
          await this.database
            .requireDb()
            .select()
            .from(providerAccounts)
            .where(eq(providerAccounts.id, id))
            .limit(1)
        )[0]
      : this.memory.get(id);
    if (!account) throw new NotFoundException("Provider account not found");
    return account;
  }

  private validateProviderFields(dto: CreateProviderAccountDto) {
    if (dto.provider === ProviderDtoType.Cloudflare && !dto.apiToken) {
      throw new BadRequestException("apiToken is required for Cloudflare");
    }
    if (
      dto.provider === ProviderDtoType.Namecheap &&
      (!dto.apiKey || !dto.apiUser || !dto.username || !dto.clientIp)
    ) {
      throw new BadRequestException(
        "apiKey, apiUser, username, and clientIp are required for Namecheap",
      );
    }
  }

  private toPublic(account: StoredAccount) {
    const safe = Object.fromEntries(
      Object.entries(account).filter(([key]) => key !== "encryptedSecret"),
    );
    return { ...safe, hasSecret: true };
  }
}
