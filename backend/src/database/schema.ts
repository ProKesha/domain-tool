import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const providerType = pgEnum("provider_type", ["namecheap", "cloudflare"]);
export const accountStatus = pgEnum("account_status", [
  "untested",
  "active",
  "invalid",
  "disabled",
]);
export const domainStatus = pgEnum("domain_status", [
  "purchased",
  "imported",
  "processing",
  "waiting_ns",
  "active",
  "error",
]);
export const jobStatus = pgEnum("job_status", [
  "queued",
  "running",
  "completed",
  "partial",
  "failed",
  "cancelled",
]);
export const jobItemStatus = pgEnum("job_item_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "skipped",
]);

export const providerAccounts = pgTable(
  "provider_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: providerType("provider").notNull(),
    label: text("label").notNull(),
    username: text("username"),
    apiUser: text("api_user"),
    email: text("email"),
    accountId: text("account_id"),
    clientIp: text("client_ip"),
    encryptedSecret: text("encrypted_secret").notNull(),
    status: accountStatus("status").default("untested").notNull(),
    lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
    lastError: text("last_error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("provider_accounts_provider_idx").on(table.provider),
    uniqueIndex("provider_accounts_label_provider_idx").on(
      table.provider,
      table.label,
    ),
  ],
);

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    status: domainStatus("status").default("purchased").notNull(),
    namecheapAccountId: uuid("namecheap_account_id").references(
      () => providerAccounts.id,
      { onDelete: "set null" },
    ),
    cloudflareAccountId: uuid("cloudflare_account_id").references(
      () => providerAccounts.id,
      { onDelete: "set null" },
    ),
    cloudflareZoneId: text("cloudflare_zone_id"),
    serverIp: text("server_ip"),
    ns1: text("ns1"),
    ns2: text("ns2"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    registrarCreatedAt: timestamp("registrar_created_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastError: text("last_error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("domains_name_idx").on(table.name),
    index("domains_status_idx").on(table.status),
    index("domains_namecheap_account_idx").on(table.namecheapAccountId),
    index("domains_cloudflare_account_idx").on(table.cloudflareAccountId),
  ],
);

export const dnsRecords = pgTable(
  "dns_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domainId: uuid("domain_id")
      .references(() => domains.id, { onDelete: "cascade" })
      .notNull(),
    provider: providerType("provider").notNull(),
    externalId: text("external_id"),
    type: text("type").notNull(),
    name: text("name").notNull(),
    content: text("content").notNull(),
    ttl: integer("ttl"),
    proxied: boolean("proxied").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("dns_records_domain_idx").on(table.domainId)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    status: jobStatus("status").default("queued").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    totalItems: integer("total_items").default(0).notNull(),
    completedItems: integer("completed_items").default(0).notNull(),
    failedItems: integer("failed_items").default(0).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("jobs_status_idx").on(table.status)],
);

export const jobItems = pgTable(
  "job_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    domainId: uuid("domain_id").references(() => domains.id, {
      onDelete: "set null",
    }),
    domainName: text("domain_name").notNull(),
    status: jobItemStatus("status").default("queued").notNull(),
    step: text("step"),
    attempt: integer("attempt").default(0).notNull(),
    error: text("error"),
    result: jsonb("result").$type<Record<string, unknown>>().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("job_items_job_idx").on(table.jobId),
    index("job_items_status_idx").on(table.status),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId)],
);

export type ProviderAccountRow = typeof providerAccounts.$inferSelect;
export type NewProviderAccountRow = typeof providerAccounts.$inferInsert;
