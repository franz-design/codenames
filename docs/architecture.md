# Architecture

Codenames is a pnpm monorepo: `apps/api` (NestJS) and `apps/web-spa` (React Router). Shared UI lives in `packages/ui`. HTTP contracts are Zod schemas on the API; `packages/openapi-generator` can regenerate a typed client from `/api/docs.json` (development). The SPA games feature uses a dedicated `games-api.ts` wrapper so it can send `X-Player-Id` consistently.

## Source of truth

Game progress is **event-sourced**.

1. An HTTP action validates the player and the current computed state.
2. The API persists a `GameEvent` (and sometimes a `Round` row for the immutable grid).
3. State is recomputed by replaying events (`computeGameState` in `game-core.logic.ts`).
4. `GamesGateway` emits `game:state` to Socket.IO room `game:{gameId}`.
5. Timeline items (including chat) are emitted as `game:timeline-item`.

`Game` stores identity and host secret (`creatorToken`), public flag, max players. Players, sides, spies, clues, and reveals are **not** a parallel mutable document; they come from events.

Pure rules live in `game-core.logic.ts` (unit-tested). `GamesService` orchestrates persistence, words, timers, and sockets.

## HTTP and realtime

| Path | Role |
|------|------|
| `POST/PATCH/DELETE /api/games/...` | Commands. Most mutations require `X-Player-Id`. Host-only routes also require `creatorToken` in the JSON body (`CreatorAuth` guard). |
| `GET /api/games/:id/state` | Snapshot. Optional `X-Player-Id` so spies receive card `results`. |
| `GET /api/games/public` | Lobby listing for public games. |
| `GET /api/words/random` | Debug/draw helper; rounds normally draw through `WordsService` on start. |
| Socket.IO namespace `/games` | Client sends `game:join` with `gameId` (and optional `playerId`). Server pushes `game:state` and `game:timeline-item`. No cookie auth. |

Global prefix is `/api`. OpenAPI UI is registered in **development** at `/api/docs` (`/api/docs.json` for the generator).

## Modules

```
apps/api/src/modules/
  db/       MikroORM, migrations, seeders
  games/    controller, service, gateway, event + round entities, game-core
  words/    categories, labels, draw logic
```

Throttling (`ThrottlerGuard`) applies to HTTP. CORS comes from `CORS_ORIGINS`. Optional `ADMIN_SPECTATOR_TOKEN` enables admin list/watch routes.

## SPA data flow

1. Create or join over REST → persist `playerId`, `creatorToken` (creator only), `gameId` in session storage.
2. Open WebSocket, `game:join`, render from `game:state`.
3. Actions go REST → new event → `game:state` → UI.

Feature layout: `apps/web-spa/app/features/games/` (pages, components, hooks, `utils/games-api.ts`). Routes: `apps/web-spa/app/routes.ts`.

## Database

PostgreSQL via Docker Compose (`db` service). MikroORM migrations live under `apps/api/src/modules/db/migrations/`. Seeders load word categories and labels.

## Related docs

- [games.md](./games.md) — actions and UI flow
- [words.md](./words.md) — packs and custom pools
- [player-identification.md](./player-identification.md)
- [backend-guidelines.md](./backend-guidelines.md)
- [frontend-guidelines.md](./frontend-guidelines.md)
