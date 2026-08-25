# API guidelines

## Stack

- NestJS
- TypeScript
- MikroORM
- Zod
- OpenAPI (development Scalar UI at `/api/docs`)
- Socket.IO for game rooms

Player identity is **not** a session cookie. Use `X-Player-Id` and, for host actions, `creatorToken`. See [player-identification.md](./player-identification.md).

## Module structure

```
modules/feature-name/
├── feature-name.module.ts
├── feature-name.controller.ts
├── feature-name.service.ts
├── feature-name.entity.ts          # single entity
├── contracts/
│   └── feature-name.contract.ts
├── entities/                       # several entities
└── tests/
    └── feature-name.controller.e2e-spec.ts
```

Games also keep pure logic in `game-core.logic.ts` (no Nest), event types in `game-event.types.ts`, and a gateway beside the service.

### Naming

- **Files:** kebab-case (`games.service.ts`)
- **Classes:** PascalCase
- **Methods / variables:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Interfaces:** PascalCase, no `I` prefix (this repo does not use `IUser` style)

## New modules

Optional generator from the repo root:

```bash
pnpm schematics:module --name=module-name
```

Without the generator, copy **games** or **words**: entity → Zod contract with `.meta()` → service → `TypedController` / `TypedRoute` → module import in `AppModule`.

Contracts: start from the read schema, then `pick` / extend for writes. Export `z.infer<typeof schema>` types.

### Controllers

- `@lonestone/nzoth/server`: `TypedController`, `TypedRoute`, `TypedBody`, `TypedParam`
- HTTP verbs as usual (`GET` read, `POST` create/command, `PATCH` partial, `DELETE` remove)
- Games commands return the computed `gameState` so HTTP clients match WebSocket payloads

### Validation

- Zod in `contracts/`
- `.meta({ title, description })` for OpenAPI
- `PlayerId` / `OptionalPlayerId` from `common/decorators/player-id.decorator.ts`
- Host routes: `CreatorAuth('...')` plus `creatorToken` on the body schema

### Errors

Nest exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`, `UnauthorizedException`). Keep messages useful for the SPA.

## Database

- UUID primary keys
- MikroORM `EntityManager`; request context exists for HTTP. Cron / gateway work must use `RequestContext` or `@EnsureRequestContext()`
- Indexes on access paths (`gameId` + `createdAt` on events)

## Testing

- Unit tests next to pure logic (`*.spec.ts`)
- HTTP e2e under `modules/*/tests/*.e2e-spec.ts`
- Jest; see [apps/api/src/test/README.md](../apps/api/src/test/README.md)
