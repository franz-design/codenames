# Games

Behavior of a Codenames session: lobby, round, timers, chat, and optional admin watch. Table rules: [rules.md](./rules.md). Identity: [player-identification.md](./player-identification.md).

## Status

Computed `status`: `LOBBY` → `PLAYING` → `FINISHED`. **Restart** (`POST /api/games/:id/restart`) returns the same players to a new lobby-style flow and increments rounds on the next start.

## Create and join

**Create** `POST /api/games`

```json
{ "pseudo": "Alice", "isPublic": false, "maxPlayers": 8 }
```

`isPublic` and `maxPlayers` (4–16) are optional. Response includes `game`, `creatorToken`, `playerId`, and `gameState`.

**Join** `POST /api/games/:id/join` with `{ "pseudo": "Bob" }` → `playerId` + `gameState`.

**Public list** `GET /api/games/public` for the home page.

SPA routes: `/` (home), `/games/new`, `/games/join`, `/games/:gameId/join` (link), `/games/:gameId` (lobby + play).

## Lobby

Players pick a **side** (`PATCH /api/games/:id/players/me/side`). They can designate themselves **spymaster** (`PATCH .../players/me/spy`). The host can designate another player (`PATCH .../players/:playerId/spy` + `creatorToken`), **shuffle** teams, **kick**, and set **timer** settings.

The SPA enables start when each side has ≥1 player and a spymaster (`canStartGame`). The API `POST /api/games/:id/rounds/start` is allowed for any non-spectator `playerId` while no round is in progress.

Start body (all optional):

- `wordCount` (default 25)
- `wordCategorySlug` / `wordCategorySlugs`
- `customWords`
- `timerSettings` (host `creatorToken` + enabled + duration)

See [words.md](./words.md).

Late joiners during `PLAYING` can be assigned a side by the host (`PATCH .../creator/players/:playerId/side`).

## Play

| Action | HTTP | Who |
|--------|------|-----|
| Give clue | `POST .../rounds/current/clue` | Current-side spymaster |
| Highlight | `POST .../rounds/current/highlight` | Current-side operative |
| Unhighlight | `DELETE .../rounds/current/highlight/:wordIndex` | Same |
| Select word | `POST .../rounds/current/select` | Current-side operative |
| Pass | `POST .../rounds/current/pass` | Current-side operative |
| Leave | `DELETE .../leave` | Player |
| Chat | `POST .../chat` | Player (body `{ "content": "..." }`, max 500) |
| Timeline | `GET .../timeline` | Paginated events + chat |

Spymasters receive `currentRound.results` (full color map). Operatives see words and `revealedWords` only.

After each mutation the room receives `game:state`. Chat and events also produce `game:timeline-item`.

## Turn timer

Host sets `{ isEnabled, durationSeconds }` (60–3600) in the lobby or on start. When enabled, `turnStartedAt` is set on round start and on pass. If the deadline passes, the server emits `TURN_PASSED`.

## Admin spectator

Disabled unless `ADMIN_SPECTATOR_TOKEN` is set on the API (SPA: `VITE_ADMIN_TOKEN`, plus `localStorage` key `adminToken`).

- UI: `/games/__admin/ongoing`
- `GET /api/games/admin/ongoing` with header `X-Admin-Token`
- `POST /api/games/:id/admin/watch` returns a spectator `playerId` (cannot mutate)
- `POST /api/games/:id/admin/unwatch` with `X-Player-Id`

Disconnecting the socket unregisters that spectator session.

## Stale games

A scheduled job in the API cleans up stale games (see `stale-games-cleanup.scheduler.ts`). Treat leftover empty/old rows as expected, not as player-facing history.
