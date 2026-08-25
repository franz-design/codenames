# API tests

Jest tests for the NestJS API.

## Layout

- Unit tests: `*.spec.ts` next to the unit (`game-core.logic.spec.ts`, `draw-words.logic.spec.ts`)
- HTTP e2e: `src/modules/*/tests/*.e2e-spec.ts` (example: `games.controller.e2e-spec.ts`)
- Shared helpers: `src/test/`

## Commands

From `apps/api`:

```bash
pnpm test
pnpm test:watch
```

From the repo root: `pnpm test`.

## Conventions

- Arrange–Act–Assert; name fixtures `inputX`, `mockX`, `actualX`, `expectedX` where it helps
- Prefer testing public behavior (HTTP or exported functions), not private methods
- e2e uses a real PostgreSQL (CI service or local Docker)
- Isolate tests; clean up with `afterEach` / `afterAll` when you open an app or DB
