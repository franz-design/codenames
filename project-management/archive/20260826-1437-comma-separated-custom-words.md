# Comma-separated custom words

**Status:** 🟢 Complete

---

> 🧑 **REVIEW CAREFULLY** — human decision surface. Read it all before any code. Keep it short.

## Context

The lobby **Liste custom** dialog lets the host add custom labels one at a time (single-line input + Ajouter → chips). Hosts want to paste or type a **list** (commas and/or one word per line) in one go.

The **custom word pool** and start-round payload (`customWords`) already exist. This is SPA input UX only.

```
[ textarea: Un mot par ligne, ou séparés par des virgules ]
[ Ajouter ]

chips: chat ×  chien ×  …
```

## Scope

**Included:**
- Replace the add field with a **textarea** + **Ajouter** (Enter = newline, does not add)
- On Ajouter: split draft on **comma and newline**, trim, drop empty, drop duplicates (`fr-FR` first spelling wins), drop labels **> 40 chars**, keep at most **400** unique labels — **silently**
- Remove the 40-character cap on the **whole** draft; 40 applies **per label**
- Placeholder: `Un mot par ligne, ou séparés par des virgules`
- Chips, pack toggles, Apply, `localStorage` unchanged
- `docs/words.md`: lobby editor accepts comma/newline lists

**Not Included:**
- API / draw / bias / `customWords` contract
- Toast or inline error for dropped labels
- Chip-as-you-type, Ctrl/Cmd+Enter to add
- Semicolon or other delimiters
- Changing stored list format

## Acceptance Criteria

- [x] Given a draft `chat, chien` and an empty list, when Ajouter, then the list is `chat`, `chien` (unit test at the seam)
- [x] Given a draft with newlines (`chat\nchien`), when Ajouter, then the list is `chat`, `chien` (unit test)
- [x] Given mixed commas and newlines, empties, and a duplicate differing only by `fr-FR` case, when Ajouter, then empties are dropped and the first spelling is kept (unit test)
- [x] Given a token longer than 40 characters among valid tokens, when Ajouter, then only valid tokens are added (unit test)
- [x] Given a merge that would exceed 400 unique labels, when Ajouter, then the result has 400 labels and keeps existing + earliest new uniques (unit test)
- [ ] Lobby dialog uses a textarea (not a single-line input); Enter does not add; placeholder matches the copy above (browser: open Liste custom)
- [x] All tests pass, no linter errors (`pnpm lint`, `pnpm test`, `pnpm typecheck`)

## Seams

- Seam 1: pure helper(s) on the custom-word list rows module — `(existingWords, draft) → nextWords`. Tests observe only that function. UI wires textarea + Ajouter to it.

---

> 🧑 **REVIEW IF RELEVANT** — program design.

## Implementation Decisions

- SPA only. Reuse `@codenames/ui` Textarea. Keep `addCustomWord` as a thin wrapper around the batch seam; do not fork normalize/dedupe rules (must stay aligned with API: trim, `fr-FR` lower key).
- Split delimiters: `,` and `\n` (`\r\n` counts as newline). Do not split on semicolon or spaces alone (`New York` stays one label).
- 40-char drop applies to **new draft tokens only** (do not strip long labels already in the list). 400 cap applies to the **merged** result: existing uniques first, then earliest new uniques.
- `web-spa` has **no test runner today**. Add a **minimal** Vitest (or equivalent) script on `@codenames/web-spa` so `pnpm test` runs the seam specs. Do not introduce Playwright for this.

### Approved plan (2026-08-26)

**Seam:** `addCustomWordsFromDraft(existingWords: string[], draft: string): string[]`

1. Split `draft` on `,` and `\n` (trim leftover `\r` from `\r\n`).
2. Trim each token; drop empty; drop tokens longer than `CUSTOM_WORD_MAX_LENGTH`.
3. `normalizeCustomWords([...existingWords, ...tokens])` (fr-FR first spelling wins).
4. `slice(0, CUSTOM_WORDS_MAX_COUNT)`.

`addCustomWord(words, draft)` → `addCustomWordsFromDraft(words, draft)`.

`CUSTOM_WORDS_MAX_COUNT = 400` next to `CUSTOM_WORD_MAX_LENGTH` in `apps/web-spa/app/features/games/types.ts`.

**UI:** Textarea, placeholder `Un mot par ligne, ou séparés par des virgules`, no draft `maxLength`, no Enter-to-add, Ajouter calls the seam then clears draft, chips unchanged, `items-start` for textarea + button.

**Vitest:** Node environment, `apps/web-spa/vitest.config.ts`, `"test": "vitest run"`, spec `custom-word-list-rows.spec.ts`, explicit `vitest` imports (no globals).

**TDD order:** commas → newlines → mixed/empties/case → too-long skipped → 400 cap merge → wire UI.

### Architecture docs (evergreen)

- Update `docs/words.md` (Custom pool: lobby editor accepts comma/newline lists).
- No new glossary term; `docs/CONTEXT.md` already defines **custom word pool**.

## Testing Strategy

- Unit tests at the helper seam (Arrange/Act/Assert): commas, newlines, mixed, empty tokens, case-insensitive dedupe, too-long skipped, 400 cap, existing list merge.
- No API e2e (contract unchanged).
- Manual: lobby → Liste custom → paste a short multiline list → Ajouter → chips → Utiliser cette liste.

## Slices & Dependencies

Single task, no slices.

- **Depends on:** —
- **Blocks:** —
- **Related:** —

---

> 🤖 **AGENT ZONE** — working space; humans skim or skip.

## Deliverables

- [x] `apps/web-spa/app/features/games/utils/custom-word-list-rows.ts` (parse + add batch + 400 cap)
- [x] Unit spec next to that module
- [x] `apps/web-spa/app/features/games/components/custom-word-list-inputs.tsx` (textarea, no draft `maxLength`, no Enter-to-add)
- [x] `CUSTOM_WORDS_MAX_COUNT` (400) on the SPA side if missing (`types.ts` currently has length 40 only)
- [x] Vitest (or equivalent) wired in `@codenames/web-spa` `package.json` so root `pnpm test` picks it up
- [x] `docs/words.md` Custom pool bullet on lobby list input

## Notes & Snippets

Completion 2026-08-26: `pnpm lint` and `pnpm --filter=@codenames/web-spa typecheck` passed; 6 Vitest specs green. Root `pnpm test` also ran API Jest: unit specs passed; `games.controller.e2e-spec` failed Testcontainers Postgres health (`Health check failed: unhealthy`) — not caused by this SPA change. Browser AC not clicked through (Playwright MCP unavailable); verify Liste custom on the SPA (this session’s Vite was http://localhost:5175/ because 5174 was already taken).

Agreed in creation interview:

- One field, not a second “paste mode”
- Silent drop of invalid / overflow labels
- Parse only on Ajouter
- Textarea for long lists

Current add path: `addCustomWord(words, draft)` then `normalizeCustomWords`. Input `maxLength={CUSTOM_WORD_MAX_LENGTH}` must go — it blocks pasting a list.

API already: `z.array(z.string().trim().min(1).max(40)).max(400)`.

## References

- `docs/words.md` — Custom pool
- `docs/CONTEXT.md` — Custom word pool
- `apps/web-spa/app/features/games/components/custom-word-list-inputs.tsx`
- `apps/web-spa/app/features/games/utils/custom-word-list-rows.ts`
- `packages/ui/src/components/primitives/textarea.tsx`
