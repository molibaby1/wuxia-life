# P6B Backend Deployment (US-029)

## Required Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (credentials via secret store, not committed) |
| `TOKEN_HASH_SECRET` | Pepper for hashing device/session tokens (min 16 chars) |
| `ENGINE_VERSION` | Active engine version label (e.g. `p6b-headless`) |
| `EVENT_CATALOG_VERSION` | Pinned catalog version (e.g. `1.0.0`) |
| `HTTP_HOST` | Bind host (default `0.0.0.0`) |
| `HTTP_PORT` | Listen port (default `8787`) |
| `NODE_ENV` | `development`, `test`, or `production` |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error` |

Web client:

| Variable | Description |
| --- | --- |
| `VITE_P6B_API_URL` | Public API base URL (HTTPS in production) |

See `.env.p6b.example` for a non-secret template.

For step-by-step local PostgreSQL + API + Vite联调, see `docs/p6b-local-dev.md`.

## PostgreSQL Setup

1. Create database and role with least privilege on the P6B schema.
2. Run migrations: `npm run p6b:migrate`
3. Seed catalog: `npm run p6b:seed-catalog`
4. Start API: `npm run p6b:serve`

## Health Checks

- Liveness: `GET /health/live` (no database)
- Readiness: `GET /health/ready` (database + active catalog)

## Web Client

Set `VITE_P6B_API_URL` to the deployed API origin before `npm run build`.

## Backup

Take logical backups (`pg_dump`) before production cutover and on a regular schedule. Snapshots and replay actions are append-only; restore drills should verify slot resume and catalog pin.

## HTTPS

Terminate TLS at a reverse proxy. Device and session tokens are bearer credentials and must not travel over plain HTTP in deployed environments.

## Known P6B Limitations

- Anonymous device only (no accounts)
- No cross-device sync or conflict merge UI beyond HTTP 409 reload prompt
- Web UI pacing remains client-side and does not trigger saves
- Mini-program and admin tooling deferred

## Deferred Work

- Account migration and linked ownership
- Mini-program HTTP adapter
- Broad Web singleton / Vue reactivity hardening
