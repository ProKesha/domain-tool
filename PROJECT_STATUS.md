# Domain Tool — стан проєкту та продовження роботи

> Оновлено: 31 липня 2026 року.
> Новій сесії Codex: спочатку прочитати цей файл, потім `README.md` і
> `docs/production-checklist.md`.

## 1. Мета проєкту

Domain Tool має максимально спростити масову роботу з доменами:

1. імпортувати куплені домени з Namecheap;
2. додавати домени до Cloudflare;
3. створювати DNS-записи `@` і `*` на IP сервера баєра;
4. змінювати IP, NS та DNS-записи для декількох доменів;
5. бачити статус, термін дії та помилки кожного домену;
6. контролювати кількість доменів у кожному Namecheap-акаунті;
7. пізніше інтегруватися з окремим сервісом керування серверами та Hestia.

Інтерфейс залишається односторінковим і англомовним. Спілкування та внутрішня
документація можуть бути українською. Згодом можна додати перемикання мов.

## 2. Обов'язкові правила безпеки

- Не копіювати у код реальні назви акаунтів, домени, IP, email або ключі зі скріншотів.
- Для демо використовувати тільки `.example` та документаційні IP-діапазони:
  `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`.
- Не просити користувача надсилати API keys або tokens у чат.
- Реальні секрети вводяться тільки через локальну/production-панель.
- Не використовувати Cloudflare Global API Key. Для production потрібен scoped API Token.
- Не перемикати `APP_MODE=live`, доки не завершені sandbox handlers, auth/RBAC,
  idempotency, audit log і staging-перевірка.

Пошук по репозиторію підтвердив, що реальні дані зі скріншотів у код не потрапили.

## 3. Поточний стан Git

- Репозиторій: `/Users/ProKesha/projectsFamily/projects-arbitration/domain-tool`
- Гілка: `main`
- Базовий commit до backend-робіт: `cdc845d`
- Поточна backend/frontend робота ще не закомічена.
- Не перезаписувати або видаляти наявні зміни: вони є поточною реалізацією проєкту.

Остання раніше опублікована frontend-версія:

- URL: `https://domain-tool-control.lort20178.chatgpt.site`
- Sites version: 13
- Вона не містить нового локального NestJS backend.
- Поточні зміни не потрібно публікувати, доки локальний flow не завершений.

## 4. Що вже реалізовано у frontend

Основний файл: `app/page.tsx`.

- Односторінковий темний dashboard.
- Усі UI-тексти англійською.
- 200 синтетичних тестових доменів.
- Пагінація по 50 доменів на сторінку.
- Внутрішній вертикальний та горизонтальний scroll таблиці.
- NC Bulk Check для одного або декількох доменів.
- Bulk-пошук працює по всіх 200 доменах, незалежно від поточної сторінки.
- Поле bulk-пошуку порожнє за замовчуванням і зберігається при reload.
- Generate domains.
- Add account: Cloudflare або Namecheap.
- Accounts panel: перегляд, test, delete, refresh.
- Фільтри, selection panel і кольорові bulk-кнопки з англомовними tooltips.
- Domain drawer з Overview та DNS Records.
- Purchases demo modal.
- Локальний API-клієнт: `app/lib/domain-api.ts`.
- На `localhost` frontend автоматично використовує `http://localhost:4000/api`.
- Badge у header показує `Local API connected`, `Checking local API`,
  `Local API offline` або `Synthetic demo data`.
- Add/Test/Delete account викликають backend, коли він доступний.
- Bulk Cloudflare/Namecheap дії створюють backend job і очікують результат.
- Без налаштованого API опублікований frontend залишається в безпечному demo fallback.

## 5. Що вже реалізовано у backend

Backend знаходиться в `backend/` і побудований на NestJS + TypeScript.

### Конфігурація

- `APP_MODE`: `mock`, `sandbox` або `live`.
- Значення за замовчуванням: `mock`.
- `DATABASE_ENABLED=false` і `REDIS_ENABLED=false` за замовчуванням.
- У mock-режимі backend запускається без Docker, PostgreSQL та Redis.
- `backend/.env.example` містить тільки синтетичні development-значення.
- Development encryption key заборонений валідатором у `live` mode.

### Безпека секретів

- `backend/src/security/secrets.service.ts`.
- AES-256-GCM.
- Для кожного шифрування генерується новий nonce.
- API ніколи не повертає `encryptedSecret`.
- Є тести на decrypt та відмову при пошкодженому ciphertext.

### Provider accounts

Endpoints:

- `GET /api/accounts`
- `POST /api/accounts`
- `POST /api/accounts/:id/test`
- `DELETE /api/accounts/:id`

Підтримуються Cloudflare і Namecheap. При ввімкненій БД акаунти зберігаються в
PostgreSQL, інакше — у пам'яті процесу. Після restart memory-дані зникають.

### Provider clients

- `backend/src/providers/cloudflare.client.ts`
- `backend/src/providers/namecheap.client.ts`

У `mock` mode credential checks симулюються. У `sandbox/live` уже є реальні
HTTP-запити тільки для перевірки credentials:

- Cloudflare: token verification;
- Namecheap: account balance API call та XML parsing.

Реальні domain mutation methods ще не реалізовані.

### PostgreSQL

Схема: `backend/src/database/schema.ts`.

Таблиці:

- `provider_accounts`
- `domains`
- `dns_records`
- `jobs`
- `job_items`
- `audit_logs`

Міграція: `backend/drizzle/0000_greedy_proteus.sql`.

`docker-compose.yml` готує:

- PostgreSQL 16 на локальному порту `5433`;
- Redis 7.4 на локальному порту `6380`.

Docker CLI зараз не встановлений на цьому Mac. Compose та SQL підготовлені, але
контейнери ще не запускалися.

### Bulk jobs

Endpoints:

- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:id`

Підтримувані типи:

- `cloudflare.setup`
- `cloudflare.remove`
- `cloudflare.change_ip`
- `namecheap.set_ns`
- `namecheap.set_hosts`
- `domain.full_reset`

До 500 доменів в одному job. Якщо Redis вимкнений, використовується memory mock
processor. Якщо Redis увімкнений, BullMQ має retry, exponential backoff і concurrency 3.

У `mock` mode job переходить `queued → running → completed`, а кожен item отримує
`simulated: true`. У `sandbox/live` реальні handlers поки навмисно не запускаються.

### Health

- `GET /api/health`
- Показує mode, database status і queue status.

## 6. Як запустити зараз

Відкрити два термінали.

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

Відкрити `http://localhost:3000`.

Backend health: `http://localhost:4000/api/health`.

## 7. Що перевірено

Успішно виконано:

```bash
npm run lint
npm test
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run build
```

Результати:

- frontend: build успішний, lint успішний, 2/2 tests passed;
- backend: typecheck успішний, production build успішний, 6/6 tests passed;
- production backend build перевірено двічі поспіль;
- HTTP flow перевірено вручну через локальний API;
- створено синтетичні Cloudflare і Namecheap акаунти;
- credential tests повернули mock success;
- bulk Cloudflare setup для двох `.example` доменів завершився успішно;
- API response не містив encrypted secret.

Під час перевірки був знайдений і виправлений Nest build-баг: `deleteOutDir` разом
з TypeScript incremental залишав неповний `dist`. У `backend/tsconfig.build.json`
для production build встановлено `incremental: false`. Не повертати його назад без
окремої перевірки повторного build/start.

## 8. Точний наступний етап

Користувач створить тестові Namecheap/Cloudflare акаунти пізніше. Зараз не потрібно
просити його робити це або вводити credentials.

Наступна реалізація повинна йти в такому порядку:

1. Реалізувати Cloudflare sandbox/test operations:
   - resolve account;
   - find/create zone idempotently;
   - set Flexible SSL;
   - upsert `@` і `*` A records;
   - replace IP without duplicate records;
   - delete zone safely.
2. Реалізувати Namecheap sandbox operations:
   - paginated domain import (`PageSize` не більше 100);
   - domain details/expiration sync;
   - custom NS update;
   - getHosts перед setHosts;
   - preserve усі host records, які не потрібно видаляти;
   - create/replace `@` і `*` A records.
3. Додати Domains module та API:
   - pagination/filter/search;
   - import/sync;
   - domain details і DNS records.
4. Замінити mock job processor на idempotent operation executor.
5. Обробляти partial failure окремо для кожного домену.
6. Додати provider rate limiting, retry classification і dead-letter handling.
7. Встановити Docker Desktop, запустити PostgreSQL/Redis та перевірити migration.
8. Додати login, RBAC, CSRF protection та реальний audit log.
9. Провести staging test на 1–2 disposable test domains.
10. Тільки після цього готувати production VPS і production credentials.

## 9. Важливі production-умови

- Namecheap API потребує whitelisted public IPv4.
- Для production потрібен VPS зі стабільним IPv4; домашній/динамічний IP ненадійний.
- Cloudflare використовувати тільки зі scoped API Token та мінімальними permissions.
- Namecheap `setHosts` замінює host records, яких немає в запиті: спочатку обов'язково
  читати наявні записи та явно зберігати ті, що не мають бути видалені.
- Bulk handlers повинні бути idempotent через автоматичні retries BullMQ.
- Destructive actions мають мати confirmation і dry-run preview.
- Production secrets мають зберігатися в secrets manager, а не в `.env` на диску.

## 10. Ключові файли

- `README.md` — запуск і короткий опис.
- `PROJECT_STATUS.md` — цей handoff-файл.
- `docs/production-checklist.md` — production gates.
- `app/page.tsx` — основний UI.
- `app/lib/domain-api.ts` — frontend API client.
- `backend/src/app.module.ts` — backend modules.
- `backend/src/database/schema.ts` — PostgreSQL schema.
- `backend/src/accounts/accounts.service.ts` — encrypted provider accounts.
- `backend/src/jobs/jobs.service.ts` — queue та mock bulk processor.
- `backend/src/providers/` — Namecheap/Cloudflare clients.
- `backend/.env.example` — backend environment template.
- `docker-compose.yml` — локальні PostgreSQL і Redis.

## 11. Definition of done для першого реального sandbox flow

Flow вважається готовим, коли один disposable домен можна:

1. імпортувати з Namecheap Sandbox;
2. idempotently додати до Cloudflare;
3. створити `@` і `*` A records на documentation/test server IP;
4. записати Cloudflare NS у Namecheap;
5. повторно запустити той самий job без дублікатів і пошкодження DNS;
6. побачити всі кроки та помилки в `job_items` і `audit_logs`;
7. виконати full reset і повернути домен у початковий стан.

До проходження цього flow реальні production-домени не підключати.
