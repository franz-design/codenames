# Codenames

Online Codenames: two teams, one 5×5 word grid, spymasters give one-word clues, operatives guess. This monorepo holds the NestJS API and the React SPA.

[![CI](https://github.com/franz-design/codenames/actions/workflows/ci.yml/badge.svg)](https://github.com/franz-design/codenames/actions/workflows/ci.yml)

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Useful commands](#useful-commands)
- [Documentation](#documentation)
- [Continuous integration](#continuous-integration)
- [Deployment](#deployment)

## Overview

Players join with a **pseudo** only (no accounts). Game state is **event-sourced**: each action is persisted, then the API recomputes state and pushes it over WebSocket. Word packs and optional custom words feed the grid.

See [docs/README.md](docs/README.md) for rules, architecture, and coding guidelines.

## Tech stack

- **API:** NestJS, MikroORM, PostgreSQL, Zod, Socket.IO
- **SPA:** React 19, React Router 7, TanStack Query, TailwindCSS, Socket.IO client
- **Shared:** `@codenames/ui` (Radix / shadcn-style primitives), `@codenames/openapi-generator` (generated types and SDK)

## Project structure

```
apps/api          NestJS REST + WebSocket API
apps/web-spa      React SPA
packages/ui       Shared UI primitives
packages/openapi-generator   OpenAPI client generated from the API
docs/             Living product and engineering docs
project-management/   Tasks, changelog, archived plans
```

## Prerequisites

- [Node.js](https://nodejs.org/) 24.10.0 (see `.nvmrc` and root `package.json` `engines`)
- [pnpm](https://pnpm.io/) 10.5.2
- [Docker](https://www.docker.com/) and Docker Compose (PostgreSQL)

## Installation

1. Clone the repository and install dependencies:

```bash
git clone git@github.com:franz-design/codenames.git
cd codenames
pnpm install
```

2. Copy environment files:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web-spa/.env.example apps/web-spa/.env
cp packages/openapi-generator/.env.example packages/openapi-generator/.env
```

Align `API_PORT`, `VITE_API_URL`, `VITE_WS_URL`, and `CORS_ORIGINS` so the SPA can reach the API (defaults in the examples: API `3004`, SPA origin around `5174`).

3. Start PostgreSQL:

```bash
pnpm docker:up
```

4. Apply migrations and seed word lists (drops and recreates the schema):

```bash
pnpm --filter=@codenames/api db:migrate:seed
```

Later, after pulling new migrations only:

```bash
pnpm --filter=@codenames/api db:migrate:up
```

5. Start the API and SPA:

```bash
pnpm dev
```

- API: `http://localhost:3004` (OpenAPI UI in development: `http://localhost:3004/api/docs`)
- SPA: Vite / React Router dev server (see `VITE_APP_ORIGIN` in `apps/web-spa/.env`)

## Useful commands

### Docker

- `pnpm docker:up` — start PostgreSQL
- `pnpm docker:down` — stop
- `pnpm docker:logs` — follow logs

### Development

- `pnpm dev` — API, SPA, and OpenAPI generator watch (parallel)
- `pnpm build` — build all workspaces
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript across workspaces
- `pnpm generate` — regenerate the OpenAPI client (API must be running)
- `pnpm test` — tests across workspaces

`pnpm install` installs a Husky **pre-push** hook. On `git push` from a terminal it prints a banner, then runs `pnpm lint:fix` and `pnpm test`. Cursor Source Control does not show that output in the terminal (check the Git output channel), and some GUIs skip hooks. If ESLint rewrites files, the push is aborted so you can commit the fixes first. API tests need Docker running (Testcontainers). To skip the hook: `git push --no-verify`.

### Database (API package)

```bash
pnpm --filter=@codenames/api db:migrate:create
pnpm --filter=@codenames/api db:migrate:up
pnpm --filter=@codenames/api db:seed
pnpm --filter=@codenames/api db:migrate:down
pnpm --filter=@codenames/api db:fresh
pnpm --filter=@codenames/api db:fresh:seed
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/README.md](docs/README.md) | Index |
| [docs/rules.md](docs/rules.md) | Table rules as implemented |
| [docs/architecture.md](docs/architecture.md) | Event store, REST, WebSocket |
| [docs/games.md](docs/games.md) | Lobby, play, timers, admin |
| [docs/words.md](docs/words.md) | Packs and custom word pools |
| [docs/player-identification.md](docs/player-identification.md) | Pseudo, `playerId`, `creatorToken` |
| [docs/backend-guidelines.md](docs/backend-guidelines.md) | NestJS conventions |
| [docs/frontend-guidelines.md](docs/frontend-guidelines.md) | SPA conventions |
| [apps/api/README.md](apps/api/README.md) | API setup |
| [apps/web-spa/README.md](apps/web-spa/README.md) | SPA setup |

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main`: install, lint, build, typecheck, and tests against PostgreSQL 16.

## Deployment

Typical options: a PaaS that builds from this monorepo (e.g. Dokploy / Railpack), or Docker images from `apps/api/Dockerfile` and `apps/web-spa/Dockerfile`. Production needs PostgreSQL, matching `CORS_ORIGINS` / `VITE_API_URL`, and (optional) `ADMIN_SPECTATOR_TOKEN` if you enable the admin spectator routes.

API start runs pending migrations (`db:migrate:up`) then the word-list seeder (`db:seed`, via `prestart`) before listening. The seeder inserts missing categories and labels only; it does not delete words already in the database. Adding a pack is: edit `apps/api/src/seeders/words.seeder.ts` and deploy.
