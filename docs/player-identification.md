# Player identification

There is **no sign-up and no player accounts**. A player joins with a **pseudo**. The server issues a `playerId` (UUID) that the client must send on later mutations.

## Create

`POST /api/games`

```json
{ "pseudo": "Alice", "isPublic": false, "maxPlayers": 8 }
```

Response includes:

- `game` — id, `creatorPseudo`, `isPublic`, `maxPlayers`, `createdAt`
- `creatorToken` — host secret (UUID)
- `playerId` — this client’s player id
- `gameState` — computed lobby state

Store `playerId` and `creatorToken` on the creator’s device (SPA: session storage). Never put `creatorToken` in the URL.

## Join

`POST /api/games/:id/join`

```json
{ "pseudo": "Bob" }
```

Response: `gameState` and `playerId`. No `creatorToken`.

## `X-Player-Id`

Mutations that act as a player (leave, side, self-spy, start, clue, select, highlight, pass, restart, chat, admin unwatch) require:

```http
X-Player-Id: <uuid>
```

Missing or non-UUID values yield **401**. Admin spectator ids cannot mutate (403).

`GET /api/games/:id/state` accepts an optional `X-Player-Id` so the snapshot can include spymaster-only `results`.

## Host (`creatorToken`)

JSON body field on host-only routes (guard `CreatorAuth`). Examples: kick, designate another player as spymaster, shuffle lobby teams, timer settings, assign a waiting player to a side mid-round. Wrong token → **403**.

## WebSocket

Namespace `/games`. No header auth. Client emits `game:join` with `gameId` and may send `playerId` so the first `game:state` is filtered like REST (spy colors). Identification for **actions** remains REST + `X-Player-Id`.

## Client storage

| Value | When | Use |
|-------|------|-----|
| `playerId` | create or join | `X-Player-Id` |
| `creatorToken` | create only | Host request bodies |
| `gameId` | create or URL | REST paths, `game:join` |

SPA session keys are owned by the games feature hooks (session storage). Custom word lists use **localStorage** (see [words.md](./words.md)).
