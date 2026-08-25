# Web SPA

React Router SPA for Codenames. Conventions: [frontend-guidelines.md](../../docs/frontend-guidelines.md). Product flow: [games.md](../../docs/games.md).

## Stack

- React 19, React Router 7, Vite
- TypeScript, TailwindCSS
- TanStack Query, react-hook-form, Zod
- `@codenames/ui`, Socket.IO client

## Setup

From the repo root (`pnpm install`), copy `apps/web-spa/.env.example` to `apps/web-spa/.env`.

| Variable | Description |
|----------|-------------|
| `VITE_APP_ORIGIN` | Public origin (share / Open Graph) |
| `VITE_API_URL` | API origin (no trailing slash) |
| `VITE_WS_URL` | Socket.IO origin (defaults can follow the API URL) |
| `VITE_ADMIN_TOKEN` | Must match API `ADMIN_SPECTATOR_TOKEN` for `/games/__admin/ongoing` |

```bash
pnpm --filter=@codenames/web-spa dev
```

## Scripts

- `pnpm dev` — React Router dev server
- `pnpm build` — production build
- `pnpm typecheck` — `react-router typegen` + `tsc`

## Layout

```
app/
  routes.ts
  features/games/    pages, components, hooks, games-api
  lib/
```

## Docker

```bash
docker build -t codenames-web-spa \
  --build-arg VITE_API_URL=https://api.example.com \
  -f apps/web-spa/Dockerfile .
docker run -p 80:80 codenames-web-spa
```

If the image supports runtime placeholder replacement for `%VITE_API_URL%`, pass `-e VITE_API_URL=...` when running. Prefer baking the API URL at build time unless you rely on that mechanism.
