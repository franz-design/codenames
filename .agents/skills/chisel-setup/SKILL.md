---
name: chisel-setup
description: Fill in .agents/project.md — the per-repo glue — after `chisel init`. Explores the repo, prefills sections A-G, presents each one at a time for confirmation, and writes accepted sections back surgically. Re-runnable later to revisit any section.
disable-model-invocation: true
---

# Chisel setup

Turn `.agents/project.md.tpl`'s defaults into this repo's actual glue. One
pass, sections A through G, each confirmed before the next. Re-running later
to revisit a section is normal — treat the current file as the starting
recommendation, not as done-forever.

## Step 0 — Precondition

Check `.agents/.chisel.json` exists. If it does not, stop here and tell the
user to run `npx @lonestone/chisel init` first — this skill configures the
glue, it never installs the socle. Do not attempt to bootstrap `.agents/`
yourself.

## Step 1 — Silent exploration

Before asking anything, scan the repo and note what you find. Do not narrate
the scan step by step — gather everything first, then state the findings as
facts when you reach the section they affect.

- **Boilerplate marker**: does `apps/documentation/` exist? If so, this is a
  **boilerplate-mode** repo — §D and §G point into it, §C is prefilled from
  its known layout. Otherwise this is **brownfield mode**.
- **`package.json` scripts**: read `lint`, `test`, `typecheck`, `build`, and
  any dev/browser-check script → prefills for §F.
- **Existing docs**: `README.md`, `doc/`, `docs/`, `CONTEXT.md`, `docs/adr/`
  → candidates for §C (reading list) and §G (glossary/ADRs).
- **Existing task workspace from a previous methodology** (e.g. a
  `doc/project-management/` from an earlier convention): if one exists,
  flag it for §A instead of silently assuming the default root.

**Fact vs decision** (same discipline as the `grilling` skill): what the scan
established is *stated* to the user, not asked. Only genuine decisions —
things the scan cannot determine on its own, or choices with real
alternatives — get a question.

## Step 2 — Walk sections A through G, one at a time

For each section, in letter order:

1. State any relevant facts from Step 1's scan.
2. Give your **recommended** value — prefilled from the scan plus the D5
   questionnaire defaults (root `/project-management/`; tracker local
   markdown; boilerplate reading list into `apps/documentation`; living docs
   = `apps/documentation` for boilerplate else `doc/**`; gate commands from
   `package.json`; glossary/ADRs into `apps/documentation` for boilerplate
   else root `CONTEXT.md` + `docs/adr/`).
3. Wait for the user's answer before moving to the next section. Accepting a
   recommendation in one word ("yes", "ok", "sounds good") is enough to move
   on — do not demand elaboration when the user is happy with the default.

**Never present two sections in the same message.** Each section gets its
own turn, exactly like the grilling discipline this skill borrows: one
question, wait, then the next.

Per-mode prefills:

- **Boilerplate mode** — §D and §G point into `apps/documentation` (THE doc
  reference: business + architecture, no split). §C is prefilled from the
  boilerplate's known layout (its `apps/documentation` entry point +
  `README.md`).
- **Brownfield mode** — §C is not a plain open question. Present the scanned
  candidates (README, whatever doc entry points the scan found) as a DRAFT
  reading list, then refine it with the user — a short back-and-forth, not a
  single blind ask. This is the "scan and assist" behavior the brownfield
  acceptance criterion asks for.

Skip §E entirely here — see Step 3.

## Step 3 — §E is read-back only, never asked

Section E (Adapters) is written by `chisel init`, not by this questionnaire.
When you reach it in the walk, read the current checklist state back to the
user as a fact (which adapters are present) — do not ask a question about it.
If an adapter is missing, do not fix it here: note it as something `chisel
check` should catch, and move on to §F.

## Step 4 — Surgical writes to `.agents/project.md`

After a section is accepted, write it immediately — do not batch writes
until the end of the walk. Each write is scoped to exactly one section:

- Find that section's `## <letter> · ...` heading.
- Replace everything from immediately after that heading line up to (but not
  including) the next `## ` heading, or end of file if there is none.
- Leave every byte outside that span untouched: other sections, any content
  a human added above §A or after §G, custom sections the file doesn't
  define (e.g. a hand-added `## H · ...`).

**Never rewrite the whole file.** A full-file rewrite is the one mistake
that would silently discard user edits living outside the questionnaire's
own sections — the whole point of this step is that it can't happen.

On a re-run, the section's *current* content in `project.md` — not the
template default — is what you present as the new recommendation in Step 2.
Accept-in-one-word keeps working on a re-run exactly as it does on a first
run.

## Step 5 — Closing summary

After §G is written, print a one-screen summary of what got written (one
line per section, A–G) and suggest the natural next move: create a first
task, or run `chisel check` to confirm the adapters are all in place.
