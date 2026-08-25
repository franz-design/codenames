---
name: sync-upstream
description: Check the Pocock-forked skills for upstream drift and, one skill at a time, propose merges that preserve our documented adaptations. The human validates every proposal; nothing is ever auto-applied.
disable-model-invocation: true
---

# Sync upstream

Keep the forked skills under `socle/agents/skills/` aligned with
`mattpocock/skills` without ever silently overwriting the adaptations we made
on top. The script (`socle/scripts/sync-upstream.sh`) is purely mechanical —
it clones/fetches the upstream cache and diffs SHAs. Judgment (reading a diff,
proposing a merge) is yours; validation is always the human's.

Run this from the chisel repo, not from an equipped project — equipped
projects receive the result later through `chisel update` (the installer's
sync pipeline), not by running this skill themselves. Expected cadence is low,
roughly 2–6 times a year, on demand.

## Step 1 — Check for drift

Run:

```
socle/scripts/sync-upstream.sh --check
```

This writes nothing. Present the drift table to the human **verbatim** —
skill name, commits behind, and the latest upstream subjects — plus any
`WARN mismatch` lines (a skill's frontmatter `sha:` disagreeing with the
lock) and the unplugged section (skills locked to `x-upstream: none`,
skipped and reported, not diffed).

Completion criterion: the human has seen the full table, not a paraphrase.

## Step 2 — Propose a merge, one skill at a time

For **each drifted skill**, in order, one at a time — never batch proposals
for multiple skills into a single message:

1. Run `socle/scripts/sync-upstream.sh --diff <skill-name>` to get the raw
   upstream diff since the recorded SHA.
2. Read that skill's own `changes:` line in its `SKILL.md` frontmatter — the
   adaptations we documented on top of the fork.
3. Propose a merge that explicitly preserves those adaptations. State it in
   the shape: "upstream changed X; our adaptation Y is kept because Z" — one
   line per point of tension between the upstream diff and our `changes:`.
4. Wait for the human's answer on that skill before moving to the next one.
   **An unanswered proposal is a rejected proposal** — do not apply it, do
   not carry it forward as assumed-approved, and do not start the next
   skill's proposal in the same breath as an unanswered one.

### Heavy-divergence clause

If preserving our adaptations would mean rewriting most of the upstream
diff — the fork has drifted far enough that "merging" is really a rewrite —
do not force it. Instead propose switching the skill to `x-upstream: none`
(the frontmatter value becomes the literal `none`; the lock value becomes the
string `"none"`) and say why. The human decides whether to unplug or still
force the merge.

## Step 3 — After a validated application

Only after the human has explicitly approved a given skill's merge (or its
unplugging):

- Update that skill's `SKILL.md` frontmatter `sha:` to the new upstream HEAD
  (or, if unplugged, replace the whole `x-upstream:` block with the literal
  `x-upstream: none`).
- Update that skill's entry in `upstream.lock.json` to match (or to the
  string `"none"` if unplugged).
- Add a dated line to `project-management/CHANGELOG.md` naming the skill and
  summarizing what was absorbed from upstream (or why it was unplugged).

Move to the next drifted skill and repeat Step 2. Do not batch these updates
across skills — each skill's frontmatter, lock entry, and changelog line land
together, right after that skill's own approval.
