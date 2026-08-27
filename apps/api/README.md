# API

NestJS backend for the Codenames SPA. HTTP lives under `/api`. Coding conventions: [backend-guidelines.md](../../docs/backend-guidelines.md). Behavior: [architecture.md](../../docs/architecture.md), [games.md](../../docs/games.md), [words.md](../../docs/words.md).

## Modules

- **Games** — create/join, event-sourced play, WebSocket `/games`, timeline, optional admin spectator
- **Words** — categories, random draw, custom labels
- **Db** — MikroORM, migrations, seeders ([db README](./src/modules/db/README.md))

## Stack

- NestJS
- MikroORM / PostgreSQL
- Zod + `@lonestone/nzoth` typed routes
- Socket.IO
- Jest

## Configuration

Copy `apps/api/.env.example` to `apps/api/.env`. Typical variables:

| Variable | Description |
|----------|-------------|
| `API_PORT` | HTTP port (example: `3004`) |
| `DATABASE_*` | PostgreSQL connection |
| `CORS_ORIGINS` | Comma-separated SPA origins |
| `API_THROTTLE_TTL_MS` / `API_THROTTLE_LIMIT` | Per-IP HTTP throttle |
| `ADMIN_SPECTATOR_TOKEN` | Optional; empty disables admin routes |
| `NODE_ENV` | `development`, `test`, `production` |

OpenAPI UI is served in development at `http://localhost:<API_PORT>/api/docs` (`/api/docs.json` for the generator).

## Scripts

From `apps/api` or `pnpm --filter=@codenames/api …`:

```bash
pnpm dev
pnpm test
pnpm db:migrate:up
pnpm db:seed
pnpm db:migrate:create
pnpm db:fresh:seed
```

## Docker

```bash
docker build -t codenames-api -f apps/api/Dockerfile .
docker run -p 3004:3004 \
  -e DATABASE_PASSWORD=password \
  -e DATABASE_USER=user \
  -e DATABASE_NAME=codenames \
  -e DATABASE_HOST=db \
  -e DATABASE_PORT=5432 \
  -e API_PORT=3004 \
  -e CORS_ORIGINS=https://your-spa.example \
  codenames-api
```

Run migrations before or as part of the container start (`pnpm db:migrate:up` then `pnpm start`). `pnpm start` runs `db:seed` via `prestart` (inserts missing word packs/labels, never deletes), then `node dist/src/main.js`.
