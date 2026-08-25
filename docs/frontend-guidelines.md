# Front-end guidelines

## Stack

- React 19
- TypeScript
- React Router 7 (`apps/web-spa`)
- TailwindCSS
- `@codenames/ui` (Radix primitives)
- TanStack Query
- react-hook-form + Zod
- socket.io-client for `/games`

Do not add account/session libraries for play. Identity is `playerId` / `creatorToken` as in [player-identification.md](./player-identification.md).

## Layout

Respect existing folders and kebab-case files.

```
app/
  routes.ts
  features/
    games/
      pages/
      components/
      hooks/
      utils/          # games-api.ts, local helpers
      types.ts
  lib/                # query client, etc.
```

- Feature-scoped code stays under `features/<name>/`.
- Shared primitives come from `@codenames/ui`.
- Generated OpenAPI types/SDK: `@codenames/openapi-generator` (`client/types.gen.ts`, `zod.gen.ts`, `sdk.gen.ts`). Games HTTP currently goes through `features/games/utils/games-api.ts` so headers stay explicit.

## Data fetching

Colocate query functions with the feature. Example shape:

```typescript
export function fetchGameStateQueryOptions(input: { gameId: string, playerId?: string }) {
  return {
    queryKey: ['games', input.gameId, 'state', input.playerId],
    queryFn: () => gamesApi.getGameState(input.gameId),
  }
}
```

Realtime: `useGameWebSocket` (join room, apply `game:state`). Do not treat React Query as the source of truth while a socket snapshot is live unless the hook is written that way.

## Routing

Declare routes in `app/routes.ts`. Game URLs:

- `/` home
- `/games/new` create
- `/games/join` join by id
- `/games/:gameId/join` join by link
- `/games/:gameId` lobby and play
- `/games/__admin/ongoing` admin spectator (token required)

## Forms

react-hook-form + Zod. Clue validation (grid-word clash, ∞ as `999`) lives in the clue form; the API still accepts a string + integer.
