# OpenAPI generator

Generates a TypeScript client from the NestJS OpenAPI document using `@hey-api/openapi-ts`.

The games SPA talks to the API mainly through `apps/web-spa/app/features/games/utils/games-api.ts`. Regenerating the client still keeps types and optional SDK helpers in sync.

## Generate

API must be running (document at `{API_URL}/api/docs.json`).

From the repo root:

```bash
pnpm generate
```

Watch mode (via `pnpm dev` in this package): wait for the spec, then regenerate on change.

## Output

Under `./client`:

- `sdk.gen.ts` — SDK functions
- `types.gen.ts` — TypeScript types
- `zod.gen.ts` — Zod schemas
- `schemas.gen.ts` — schema details

Consumed by `apps/web-spa` and `packages/ui` as `@codenames/openapi-generator`.

## Config

`openapi-ts.config.ts` — input URL, plugins (fetch client, transformers, TypeScript, SDK, Zod).
