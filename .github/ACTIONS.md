# GitHub Actions

Workflows for the Codenames monorepo.

## CI

`.github/workflows/ci.yml` runs on push and pull request to `main`.

Jobs:

1. **Setup** — Node **24.10.0**, pnpm **10.5.2**, `pnpm install`, workspace cache
2. **Lint** — `pnpm lint`
3. **Build** — `pnpm -r build`
4. **Type check** — `pnpm -r run typecheck` (needs the build output)
5. **Test** — `pnpm test` with a PostgreSQL 16 service

Reusable Node/pnpm setup: `.github/actions/setup-node-pnpm`.

## Adding a workflow

Add a YAML file under `.github/workflows/`, define triggers and jobs, and push.

## Links

- [GitHub Actions docs](https://docs.github.com/en/actions)
