# Production checklist

The current build is a local development foundation, not yet authorized for real domains.

## Required before staging

- Implement and test all Namecheap domain-list, nameserver and host-record operations in sandbox.
- Implement and test Cloudflare zone, DNS record and SSL operations with scoped API tokens.
- Add domain import/sync endpoints and persist provider IDs, expiration dates and errors.
- Make job handlers idempotent so retries cannot duplicate or corrupt provider state.
- Preserve every Namecheap host record that is not intentionally replaced by `setHosts`.
- Add per-provider rate limiting, retry classification and dead-letter handling.
- Add login, role-based authorization and CSRF protection for every write operation.
- Add immutable audit events for account, domain, DNS and bulk-operation changes.
- Add confirmation screens for destructive actions and a dry-run preview.
- Add integration tests against Namecheap sandbox and mocked Cloudflare HTTP fixtures.

## Required infrastructure

- A VPS or platform with a stable public IPv4 whitelisted in every Namecheap account.
- Managed PostgreSQL with encrypted backups and tested restoration.
- Managed Redis or a durable Redis deployment for BullMQ.
- HTTPS, a private admin hostname, firewall rules and restricted database/Redis networking.
- A secrets manager for `ENCRYPTION_KEY`, database credentials and deployment credentials.
- Separate development, staging and production environments with different keys and databases.
- Central logs, error monitoring, queue alerts and API uptime monitoring.

## Go-live gates

- Run the complete flow on disposable sandbox/test domains first.
- Verify rollback for partial Cloudflare/Namecheap failures.
- Verify least-privilege Cloudflare token permissions.
- Verify the server IPv4 is whitelisted by Namecheap and cannot change unexpectedly.
- Rotate the development encryption key and reject `APP_MODE=mock` in production deployment.
- Perform a database backup and restore drill.
- Review logs to confirm no API token, API key or encrypted payload is emitted.
- Approve a small canary batch before enabling large bulk jobs.
