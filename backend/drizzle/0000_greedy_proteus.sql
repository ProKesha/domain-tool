CREATE TYPE "public"."account_status" AS ENUM('untested', 'active', 'invalid', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."domain_status" AS ENUM('purchased', 'imported', 'processing', 'waiting_ns', 'active', 'error');--> statement-breakpoint
CREATE TYPE "public"."job_item_status" AS ENUM('queued', 'running', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'completed', 'partial', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('namecheap', 'cloudflare');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dns_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"provider" "provider_type" NOT NULL,
	"external_id" text,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"ttl" integer,
	"proxied" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "domain_status" DEFAULT 'purchased' NOT NULL,
	"namecheap_account_id" uuid,
	"cloudflare_account_id" uuid,
	"cloudflare_zone_id" text,
	"server_ip" text,
	"ns1" text,
	"ns2" text,
	"expires_at" timestamp with time zone,
	"registrar_created_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"domain_id" uuid,
	"domain_name" text NOT NULL,
	"status" "job_item_status" DEFAULT 'queued' NOT NULL,
	"step" text,
	"attempt" integer DEFAULT 0 NOT NULL,
	"error" text,
	"result" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"total_items" integer DEFAULT 0 NOT NULL,
	"completed_items" integer DEFAULT 0 NOT NULL,
	"failed_items" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider_type" NOT NULL,
	"label" text NOT NULL,
	"username" text,
	"api_user" text,
	"email" text,
	"account_id" text,
	"client_ip" text,
	"encrypted_secret" text NOT NULL,
	"status" "account_status" DEFAULT 'untested' NOT NULL,
	"last_tested_at" timestamp with time zone,
	"last_error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dns_records" ADD CONSTRAINT "dns_records_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_namecheap_account_id_provider_accounts_id_fk" FOREIGN KEY ("namecheap_account_id") REFERENCES "public"."provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_cloudflare_account_id_provider_accounts_id_fk" FOREIGN KEY ("cloudflare_account_id") REFERENCES "public"."provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "dns_records_domain_idx" ON "dns_records" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "domains_name_idx" ON "domains" USING btree ("name");--> statement-breakpoint
CREATE INDEX "domains_status_idx" ON "domains" USING btree ("status");--> statement-breakpoint
CREATE INDEX "domains_namecheap_account_idx" ON "domains" USING btree ("namecheap_account_id");--> statement-breakpoint
CREATE INDEX "domains_cloudflare_account_idx" ON "domains" USING btree ("cloudflare_account_id");--> statement-breakpoint
CREATE INDEX "job_items_job_idx" ON "job_items" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_items_status_idx" ON "job_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "provider_accounts_provider_idx" ON "provider_accounts" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_accounts_label_provider_idx" ON "provider_accounts" USING btree ("provider","label");