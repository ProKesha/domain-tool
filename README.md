# Domain Tool

Domain Tool — це вебпанель для централізованого керування великою кількістю
доменів у Namecheap і Cloudflare. Проєкт об'єднує frontend-інтерфейс, NestJS API,
зберігання provider-акаунтів і чергу масових операцій в одному репозиторії.

Основна мета — замінити ручне перемикання між кабінетами реєстратора, Cloudflare
і таблицями єдиним робочим простором, де можна знайти домен, перевірити його стан
та запустити однакову операцію одразу для групи доменів.

> Поточна версія є безпечною development-основою. У `APP_MODE=mock` вона працює
> із синтетичними `.example` доменами та не змінює реальні дані у провайдерів.

Докладний стан реалізації: [PROJECT_STATUS.md](./PROJECT_STATUS.md). Перед
підключенням справжніх акаунтів обов'язково прочитайте
[production checklist](./docs/production-checklist.md).

## Навіщо потрібен цей проєкт

- зберігати список доменів і стан їх підключення в одному місці;
- контролювати домени в декількох Namecheap і Cloudflare акаунтах;
- масово додавати або видаляти Cloudflare zones;
- змінювати IP, nameservers і DNS-записи для вибраних доменів;
- бачити прогрес та помилки кожної масової операції;
- зменшити кількість ручних дій і ризик помилки під час повторюваних змін;
- надалі інтегрувати домени з окремою системою керування серверами.

## Що вже реалізовано

### Frontend

- односторінковий dashboard із 200 синтетичними доменами;
- пошук, фільтри, вибір доменів і пагінація;
- drawer з інформацією про домен та DNS-записи;
- панель Cloudflare і Namecheap акаунтів;
- запуск bulk-операцій через локальний API;
- безпечний synthetic fallback, якщо API недоступний.

### Backend

- NestJS REST API з режимами `mock`, `sandbox` і `live`;
- зашифроване зберігання provider credentials через AES-256-GCM;
- API для створення, перевірки, перегляду та видалення акаунтів;
- API масових jobs із результатом для кожного домену;
- PostgreSQL-схема та Drizzle migration;
- опціональна BullMQ/Redis черга з retry, backoff і concurrency;
- memory mode для локального запуску без Docker;
- health endpoint зі станом API, бази даних і черги.

Підтримувані типи bulk jobs:

- `cloudflare.setup`;
- `cloudflare.remove`;
- `cloudflare.change_ip`;
- `namecheap.set_ns`;
- `namecheap.set_hosts`;
- `domain.full_reset`.

## Важливі обмеження

- у `mock` mode усі provider mutations симулюються;
- у `sandbox/live` реалізована лише перевірка credentials, але не реальні зміни доменів;
- імпорт і синхронізація реальних доменів ще потребують реалізації;
- login, RBAC, CSRF protection та production audit flow ще не готові;
- `APP_MODE=live` не можна використовувати до завершення production checklist.

## Технології

- Frontend: React 19, Next.js 16, TypeScript, Tailwind CSS, vinext/Vite;
- Backend: NestJS 11, TypeScript;
- Data: PostgreSQL 16, Drizzle ORM;
- Jobs: Redis 7.4, BullMQ;
- Security: AES-256-GCM, Helmet, DTO validation;
- Local infrastructure: Docker Compose.

## Структура репозиторію

```text
domain-tool/
├── app/                       # frontend та API client
├── backend/                   # NestJS API
│   ├── drizzle/               # SQL migrations
│   ├── src/                   # backend modules
│   └── test/                  # backend tests
├── docs/                      # production checklist
├── tests/                     # frontend/render tests
├── docker-compose.yml         # PostgreSQL + Redis
├── .env.example               # безпечний frontend приклад
└── PROJECT_STATUS.md          # технічний handoff і поточний стан
```

## Вимоги

- Node.js `22.13` або новіший;
- npm;
- Docker Desktop — лише для persistent PostgreSQL і Redis.

## Швидкий локальний запуск

Відкрийте два термінали в корені проєкту.

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

Відкрийте [http://localhost:3000](http://localhost:3000). Health endpoint API:
[http://localhost:4000/api/health](http://localhost:4000/api/health).

За замовчуванням база і Redis вимкнені. Дані зберігаються в пам'яті процесу та
зникають після перезапуску API.

## PostgreSQL і Redis

Запустіть локальну інфраструктуру:

```bash
docker compose up -d postgres redis
cp backend/.env.example backend/.env
openssl rand -hex 32
```

Запишіть згенерований ключ у `ENCRYPTION_KEY` файлу `backend/.env` і змініть:

```dotenv
DATABASE_ENABLED=true
REDIS_ENABLED=true
```

Застосуйте міграцію та запустіть API:

```bash
npm --prefix backend run db:migrate
npm run dev:api
```

Файл `backend/.env` не можна додавати в Git. У репозиторії має залишатися лише
`backend/.env.example` без реальних ключів.

## Основні API endpoints

| Method | Path | Призначення |
|---|---|---|
| `GET` | `/api/health` | Стан API, PostgreSQL і Redis |
| `GET` | `/api/accounts` | Метадані акаунтів без секретів |
| `POST` | `/api/accounts` | Додати зашифрований provider account |
| `POST` | `/api/accounts/:id/test` | Перевірити credentials |
| `DELETE` | `/api/accounts/:id` | Видалити provider account |
| `GET` | `/api/jobs` | Останні масові операції |
| `POST` | `/api/jobs` | Створити job максимум для 500 доменів |
| `GET` | `/api/jobs/:id` | Статус job та per-domain результати |

## Перевірка проєкту

```bash
npm run lint
npm test
npm --prefix backend run typecheck
npm run test:api
npm run build:api
```

## Безпека

- не комітьте `.env`, API tokens, passwords або реальні домени/IP;
- не використовуйте Cloudflare Global API Key — потрібен scoped API Token;
- вводьте credentials тільки через локальний або production UI;
- для демонстрацій використовуйте `.example` та документаційні IP-діапазони;
- перед staging реалізуйте idempotency, rate limiting, authentication та audit log;
- перед production перевірте backup/restore, HTTPS і least-privilege permissions.

## Поточний статус

Проєкт придатний для локальної розробки, UI-демонстрації та тестування API в
`mock` mode. Він ще не готовий до керування реальними production-доменами.
