# Domain Tool — project status and continued work

> Updated: July 31, 2026.
> New Codex session: first read this file, then `README.md` and
> `docs/production-checklist.md`.

## 1. The purpose of the project

Domain Tool should simplify bulk work with domains as much as possible:

1. import purchased domains from Namecheap;
2. add domains to Cloudflare;
3. create DNS records `@` and `*` on the IP of the buyer's server;
4. change IP, NS and DNS records for several domains;
5. see the status, expiration date and errors of each domain;
6. control the number of domains in each Namecheap account;
7. later integrate with a separate server management service and Hestia.

The interface remains single-page and English-language. All repository documentation,
code comments, tests, and user-facing text must also remain in English.

## 2. Mandatory safety rules

- Do not copy real account names, domains, IP, email or keys from screenshots into the code.
- For demo use only `.example` and documentation IP ranges:
  `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`.
- Do not ask the user to send API keys or tokens to the chat.
- Real secrets are entered only through the local/production panel.
- Do not use Cloudflare Global API Key. Production requires a scoped API Token.
- Do not toggle `APP_MODE=live` until sandbox handlers, auth/RBAC,
  idempotency, audit log and staging check.

A search of the repository confirmed that the actual data from the screenshots did not make it into the code.

## 3. The current state of Git

- Repository: `/Users/ProKesha/projectsFamily/projects-arbitration/domain-tool`
- Branch: `main`
- Base commit to backend works: `cdc845d`
- The current backend/frontend work has not yet been completed.
- Do not overwrite or delete existing changes: they are the current implementation of the project.

The latest previously published frontend version:

- URL: `https://domain-tool-control.lort20178.chatgpt.site`
- Sites version: 13
- It does not contain the new local NestJS backend.
- Current changes do not need to be published until the local flow is complete.

## 4. What is already implemented in the frontend

Main file: `app/page.tsx`.

- One-page dark dashboard.
- All UI texts are in English.
- 200 synthetic test domains.
- Pagination for 50 domains per page.
- Internal vertical and horizontal scroll of the table.
- NC Bulk Check for one or more domains.
- Bulk search works on all 200 domains, regardless of the current page.
- The bulk search field is empty by default and is saved during reload.
- Generate domains.
- Add account: Cloudflare or Namecheap.
- Accounts panel: view, test, delete, refresh.
- Filters, selection panel and colored bulk buttons with English tooltips.
- Domain drawer with Overview and DNS Records.
- Purchases demo modal.
- Local API Client: `app/lib/domain-api.ts`.
- On `localhost` frontend automatically uses `http://localhost:4000/api`.
- Badge in the header shows `Local API connected`, `Checking local API`,
  `Local API offline` or `Synthetic demo data`.
- Add/Test/Delete account are called by the backend when it is available.
- Bulk Cloudflare/Namecheap actions create a backend job and expect a result.
- Without a configured API, the published frontend remains in a secure demo fallback.

## 5. What is already implemented in the backend

The backend is in `backend/` and is built on NestJS + TypeScript.

### Configuration

- `APP_MODE`: `mock`, `sandbox` or `live`.
- Default value: `mock`.
- `DATABASE_ENABLED=false` and `REDIS_ENABLED=false` by default.
- In mock mode, the backend runs without Docker, PostgreSQL, and Redis.
- `backend/.env.example` contains only synthetic development values.
- Development encryption key is prohibited by the validator in `live` mode.

### Security of secrets

- `backend/src/security/secrets.service.ts`.
- AES-256-GCM.
- A new nonce is generated for each encryption.
- The API never returns `encryptedSecret`.
- There are tests for decrypt and failure with damaged ciphertext.

### Provider accounts

Endpoints:

- `GET /api/accounts`
- `POST /api/accounts`
- `POST /api/accounts/:id/test`
- `DELETE /api/accounts/:id`

Cloudflare and Namecheap are supported. When the database is enabled, accounts are stored in
PostgreSQL, otherwise — in process memory. After a restart, the memory data disappears.

### Provider clients

- `backend/src/providers/cloudflare.client.ts`
- `backend/src/providers/namecheap.client.ts`

In `mock` mode, credential checks are simulated. `sandbox/live` already has real ones
HTTP requests only to check credentials:

- Cloudflare: token verification;
- Namecheap: account balance API call and XML parsing.

Real domain mutation methods have not yet been implemented.

### PostgreSQL

Scheme: `backend/src/database/schema.ts`.

Tables:

- `provider_accounts`
- `domains`
- `dns_records`
- `jobs`
- `job_items`
- `audit_logs`

Migration: `backend/drizzle/0000_greedy_proteus.sql`.

`docker-compose.yml` prepares:

- PostgreSQL 16 on local port `5433`;
- Redis 7.4 on local port `6380`.

Docker CLI is not currently installed on this Mac. Compose and SQL are prepared but
containers have not started yet.

### Bulk jobs

Endpoints:

- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:id`

Supported types:

- `cloudflare.setup`
- `cloudflare.remove`
- `cloudflare.change_ip`
- `namecheap.set_ns`
- `namecheap.set_hosts`
- `domain.full_reset`

Up to 500 domains in one job. If Redis is disabled, memory mock is used
processor. If Redis is enabled, BullMQ has retry, exponential backoff and concurrency 3.

In `mock` mode job goes to `queued → running → completed`, and each item receives
`simulated: true`. In `sandbox/live`, real handlers are not intentionally started yet.

### Health

- `GET /api/health`
- Shows mode, database status and queue status.

## 6. How to launch now

Open two terminals.

Terminal 1:

```bash
cd /Users/ProKesha/projectsFamily/projects-arbitration/domain-tool
npm run dev:api
```

Terminal 2:

```bash
cd /Users/ProKesha/projectsFamily/projects-arbitration/domain-tool
npm run dev
```

Open `http://localhost:3000`.

Backend health: `http://localhost:4000/api/health`.

## 7. What is verified

Successfully completed:

```bash
npm run lint
npm test
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run build
```

Results:

- frontend: build successful, lint successful, 2/2 tests passed;
- backend: typecheck successful, production build successful, 6/6 tests passed;
- production backend build checked twice in a row;
- HTTP flow is checked manually via local API;
- created synthetic Cloudflare and Namecheap accounts;
- credential tests returned mock success;
- bulk Cloudflare setup for two `.example` domains completed successfully;
- The API response did not contain an encrypted secret.

Nest build bug: `deleteOutDir` was found and fixed during the check
with TypeScript incremental left incomplete `dist`. In `backend/tsconfig.build.json`
the production build is set to `incremental: false`. Do not turn it back without
separate check of repeated build/start.

## 8. The exact next stage

User will create test Namecheap/Cloudflare accounts later. No need now
ask him to do so or enter credentials.

The next implementation should go in this order:

1. Implement Cloudflare sandbox/test operations:
   - resolve account;
   - find/create zone idempotently;
   - set Flexible SSL;
   - upsert `@` and `*` A records;
   - replace IP without duplicate records;
   - delete zone safely.
2. Implement Namecheap sandbox operations:
   - paginated domain import (`PageSize` no more than 100);
   - domain details/expiration sync;
   - custom NS update;
   - getHosts before setHosts;
   - preserve all host records that do not need to be deleted;
   - create/replace `@` and `*` A records.
3. Add Domains module and API:
   - pagination/filter/search;
   - import/sync;
   - domain details and DNS records.
4. Replace mock job processor with idempotent operation executor.
5. Handle partial failure separately for each domain.
6. Add provider rate limiting, retry classification and dead-letter handling.
7. Install Docker Desktop, run PostgreSQL/Redis and check the migration.
8. Add login, RBAC, CSRF protection and a real audit log.
9. Conduct a staging test on 1–2 disposable test domains.
10. Only after that prepare production VPS and production credentials.

## 9. Important production conditions

- Namecheap API requires whitelisted public IPv4.
- For production, you need a VPS with stable IPv4; home/dynamic IP is unreliable.
- Use Cloudflare only with a scoped API Token and minimal permissions.
- Namecheap `setHosts` replaces host records that are not in the request: first mandatory
  read existing records and explicitly store those that should not be deleted.
- Bulk handlers must be idempotent due to BullMQ's automatic retries.
- Destructive actions must have confirmation and dry-run preview.
- Production secrets should be stored in the secrets manager, not in `.env` on disk.

## 10. Key files

- `README.md` - launch and brief description.
- `PROJECT_STATUS.md` is this handoff file.
- `docs/production-checklist.md` — production gates.
- `app/page.tsx` is the main UI.
- `app/lib/domain-api.ts` — frontend API client.
- `backend/src/app.module.ts` — backend modules.
- `backend/src/database/schema.ts` — PostgreSQL schema.
- `backend/src/accounts/accounts.service.ts` — encrypted provider accounts.
- `backend/src/jobs/jobs.service.ts` — queue and mock bulk processor.
- `backend/src/providers/` — Namecheap/Cloudflare clients.
- `backend/.env.example` — backend environment template.
- `docker-compose.yml` - Local PostgreSQL and Redis.

## 11. Definition of done for the first real sandbox flow

Flow is considered ready when one disposable domain can:

1. import from Namecheap Sandbox;
2. idempotently add to Cloudflare;
3. create `@` and `*` A records on the documentation/test server IP;
4. register Cloudflare NS with Namecheap;
5. re-run the same job without duplicates and DNS damage;
6. see all steps and errors in `job_items` and `audit_logs`;
7. perform a full reset and return the domain to its initial state.

Do not connect real production domains before completing this flow.
