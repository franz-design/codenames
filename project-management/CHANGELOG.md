# Changelog

Project history, newest first.

## 2026-08-27

- API production start seeds missing word packs after migrations (`prestart` → `db:seed`). The seeder inserts absent labels only and never deletes existing words.

## 2026-08-26

- Lobby Liste custom: hosts can paste comma- and newline-separated labels in a textarea; invalid and overflow labels are dropped silently. `@codenames/web-spa` now runs Vitest for that seam.
- Created task `20260826-1437-comma-separated-custom-words`: lobby custom-word editor accepts comma- and newline-separated lists (textarea, silent drop of invalid/overflow labels).

## 2026-08-25

- Rewrote product and engineering docs for this Codenames repo (no template/boilerplate framing). Historical game plans moved to `project-management/archive/`.
- chisel init: installed the dev-workflow socle.
