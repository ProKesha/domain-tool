# Domain Tool

Domain Tool is a web application for centralized management of large numbers of
domains in Namecheap and Cloudflare. The project combines a frontend dashboard,
a NestJS API, provider account storage, and a bulk-operation queue in one repository.

The main goal is to replace manual switching between registrar accounts, Cloudflare,
and spreadsheets with one workspace where operators can find a domain, check its
status, and run the same operation for a group of domains.

> The current version is a secure development base. In `APP_MODE=mock` it works
> with synthetic `.example` domains and does not change real data from providers.

Detailed implementation status: [PROJECT_STATUS.md](./PROJECT_STATUS.md). Before
connecting real accounts, be sure to read
[production checklist](./docs/production-checklist.md).

## Why is this project needed?

- keep a list of domains and their connection status in one place;
- control domains in several Namecheap and Cloudflare accounts;
- bulk add or remove Cloudflare zones;
- change IP, nameservers and DNS records for selected domains;
- see the progress and errors of each mass operation;
- reduce the number of manual actions and the risk of error during repeated changes;
- further integrate domains with a separate server management system.

## What has already been implemented

### Frontend

- one-page dashboard with 200 synthetic domains;
- search, filters, domain selection and pagination;
- drawer with information about the domain and DNS records;
- panel of Cloudflare and Namecheap accounts;
- launching bulk operations through the local API;
- safe synthetic fallback if the API is not available.

### Backend

- NestJS REST API with modes `mock`, `sandbox` and `live`;
- encrypted storage of provider credentials via AES-256-GCM;
- API for creating, verifying, viewing and deleting accounts;
- bulk-job API with a result for each domain;
- PostgreSQL schema and Drizzle migration;
- optional BullMQ/Redis queue with retry, backoff and concurrency;
- memory mode for local startup without Docker;
- health endpoint with API, database and queue status.

Supported types of bulk jobs:

- `cloudflare.setup`;
- `cloudflare.remove`;
- `cloudflare.change_ip`;
- `namecheap.set_ns`;
- `namecheap.set_hosts`;
- `domain.full_reset`.

## Important limitations

- in `mock` mode all provider mutations are simulated;
- in `sandbox/live`, only the verification of credentials is implemented, but not real domain changes;
- import and synchronization of real domains still need implementation;
- login, RBAC, CSRF protection and production audit flow are not yet ready;
- `APP_MODE=live` cannot be used until the production checklist is completed.

## Technologies

- Frontend: React 19, Next.js 16, TypeScript, Tailwind CSS, vinext/Vite;
- Backend: NestJS 11, TypeScript;
- Data: PostgreSQL 16, Drizzle ORM;
- Jobs: Redis 7.4, BullMQ;
- Security: AES-256-GCM, Helmet, DTO validation;
- Local infrastructure: Docker Compose.

## Repository structure

```text
domain-tool/
├── app/                       # frontend and API client
├── backend/                   # NestJS API
│   ├── drizzle/               # SQL migrations
│   ├── src/                   # backend modules
│   └── test/                  # backend tests
├── docs/                      # production checklist
├── tests/                     # frontend/render tests
├── docker-compose.yml         # PostgreSQL + Redis
├── .env.example               # safe frontend configuration example
└── PROJECT_STATUS.md          # technical handoff and current status
```

## Requirements

- Node.js `22.13` or newer;
- npm;
- Docker Desktop — only for persistent PostgreSQL and Redis.

## Quick start

Open two terminals in the root of the project.

API:

```bash
npm --prefix backend install
npm run dev:api
```

Frontend:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health endpoint is:
[http://localhost:4000/api/health](http://localhost:4000/api/health).

By default, the database and Redis are disabled. Data is stored in process memory and
disappears when the API restarts.

## PostgreSQL and Redis

Start the local infrastructure:

```bash
docker compose up -d postgres redis
cp backend/.env.example backend/.env
openssl rand -hex 32
```

Set the generated value as `ENCRYPTION_KEY` in `backend/.env`, then enable persistence:

```dotenv
DATABASE_ENABLED=true
REDIS_ENABLED=true
```

Apply the migration and run the API:

```bash
npm --prefix backend run db:migrate
npm run dev:api
```

Never commit `backend/.env`. Only `backend/.env.example`, without real keys, belongs
in the repository.

## Basic API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | API, PostgreSQL, and Redis status |
| `GET` | `/api/accounts` | Metadata of accounts without secrets |
| `POST` | `/api/accounts` | Add an encrypted provider account |
| `POST` | `/api/accounts/:id/test` | Check credentials |
| `DELETE` | `/api/accounts/:id` | Delete provider account |
| `GET` | `/api/jobs` | Recent mass operations |
| `POST` | `/api/jobs` | Create a job for a maximum of 500 domains |
| `GET` | `/api/jobs/:id` | Job status and per-domain results |

## Verification

```bash
npm run lint
npm test
npm --prefix backend run typecheck
npm run test:api
npm run build:api
```

## Security

- do not commit `.env`, API tokens, passwords or real domains/IPs;
- do not use Cloudflare Global API Key - scoped API Token is required;
- enter credentials only through the local or production UI;
- for demos use `.example` and documentation IP ranges;
- before staging, implement idempotency, rate limiting, authentication and audit log;
- before production, check backup/restore, HTTPS and least-privilege permissions.

## Current status

The project is suitable for local development, UI demonstration and API testing in
`mock` mode. It is not yet ready to manage real production domains.
