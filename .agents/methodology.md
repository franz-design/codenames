# Methodology — the why behind the workflow

This document explains the reasoning behind the task workflow so that humans
and agents apply it with judgement, not cargo-cult. The **what/where** lives in
the rules (`.agents/rules/task-*.md`) and the task file template declared in
`.agents/project.md` (default `/project-management/000-task-file-template.md`);
the **when/how it chains** is the visual guide in
[workflows.md](./workflows.md); this is the **why**.

Provenance: fusion of the Lonestone task lifecycle (creation → work →
completion, dated CHANGELOG) with patterns from
[mattpocock/skills](https://github.com/mattpocock/skills) (MIT) and dex's
"Why Software Factories Fail" series. Full analysis: `SDD-bench/fusion-pierrick-pocock.md`.

---

## Glossary (uniform wording)

| Term | Meaning |
|---|---|
| **Task** | The unit of work AND its artifact: one markdown file in the task workspace declared in `.agents/project.md` (default `/project-management/tasks/`), named `<time-id>-<intention>.md`. Self-contained, review-gradient structured. |
| **Slice** | A child task produced by decomposing a large task: a tracer-bullet vertical cut through every layer, demoable on its own, sized for a single fresh context window. Lives as `tasks/<time-id>-<feature>/<NN>-<slug>.md`. A small task IS its own single slice — no slice files are created for it. |
| **Seam** | The public boundary where a feature is tested — agreed with the human BEFORE implementation. Tests live at seams, never against internals. Fewer is better (ideal: one). |
| **Reading gradient** | The ordering of a task file by review criticality: 🧑 REVIEW CAREFULLY (short, decision-rich) → 🧑 REVIEW IF RELEVANT (program design) → 🤖 AGENT ZONE (verbose working space). Detail is never cut, it is ordered. |
| **Blocking edge** | A dependency between slices: "slice 3 is blocked by slice 1". A slice with no blockers can start immediately. |
| **Frontier** | The set of slices whose blockers are all done — what can be worked on right now. |
| **Expand–contract** | The sequencing for wide mechanical refactors (rename a column, retype a shared symbol): add the new form beside the old → migrate call sites in batches → delete the old form. The exception to vertical slicing. |
| **One-shot** | Work done without a task file. The work rules (context preamble, plan-first, vertical discipline) still apply; only the file bookkeeping is skipped. |

We do NOT use the word "ticket" for local work. It is reserved for items in an
external tracker (Linear, GitHub Issues), if/when one is wired up — see
`.agents/project.md`, Tracker section.

---

## Why a reading gradient (and not shorter files)

Models cannot be trusted to maintain codebase quality over time without human
steering, so the human must review — and review is only cheap when the human
knows **what** to read and **how carefully**. The gradient answers that
directly: the top of a task file is the decision surface (read it entirely,
before any code); the bottom is agent working space (skim or skip).

This reconciles detail vs brevity: we don't cut detail, we order it by review
criticality. Only the top must stay short — prefer a mockup or diagram over
three paragraphs. Every decision NOT made explicit in a 🧑 zone is a decision
the human would otherwise make implicitly during code review — the most
expensive possible moment to change one's mind.

The 🧑 zones are the human's property. An agent that discovers a conflict with
them must stop and surface it, never silently override.

## Why seams are agreed before implementation

A seam is program design the human owns. Agreeing seams up front means testing
effort lands on critical paths instead of every edge case, and the tests
survive refactors because they observe public behavior, not internals. It is
also the cheapest moment to catch a bad boundary — before code exists on both
sides of it.

## Why slicing is conditional (the sizing check)

The sizing check runs for EVERY task; the slice files are only created when
the answer demands them. Rationale:

- A slice is defined as "fits in a single fresh context window, demoable in
  one pass". A small task already satisfies both — slicing it would produce a
  folder with one slice that duplicates the task file. Pure ceremony.
- What slicing adds is **decomposition**: blocking edges, the frontier, the
  order. That only has value when there are actually multiple pieces.
- Real-world distribution (dex): ~40% of work is one-shot, medium work gets a
  single document, only large work gets the full breakdown. Rigor must adapt
  to the work, not the other way around.

What IS unconditional: the check itself, stated out loud. The agent announces
"this fits in one pass" or "this needs slicing, here is the breakdown", and
the human arbitrates. A silent sizing decision is a review hole.

Note the distinction: **vertical-slice discipline during implementation**
(never layer-by-layer, something demoable at each step) applies to ALL work,
sliced or not. Only the decomposition artifact is conditional.

## Why slices are born thin — and get their design at plan time

A slice file at publishing time carries only intent: what to build, acceptance
criteria, blocking edges. The program design (target shape, signatures, test
order) is deliberately NOT written at slicing time: designing slice 6 before
slices 1–3 have taught anything produces stale guesses — file paths rot,
learning is ignored. Instead, the implementing session designs **just-in-time
at its plan gate**, with the real code in view.

But that plan must not die with the conversation. Once approved, the
implementing session **persists it into the slice file's Design section**
(rule: `task-progressing.md`). Three reasons:

1. **The completion review reads the file.** `code-review`'s Spec axis treats
   the task file as the requirements; a design that lives only in chat is
   invisible to it — the review would check 4 criteria instead of the design.
2. **Dependent slices read the file.** Slice 04 builds on decisions made in
   slice 01's plan; the file is the only channel between fresh contexts.
3. **Re-runs and crashes.** The artifact must stay self-contained (context
   hygiene) — a session must be resumable from the file alone.

So the lifecycle of a slice file is: thin at birth (intent) → design persisted
at plan approval → worklog during implementation → checked off at completion.

**Corollary — the cost gradient (opt-in delegation).** Persisting the plan
makes the slice file a complete brief, which unlocks a division of labor: the
**planner session** does the thinking (interview, design, plan) with the
human; an optional **typist session** does only the typing from that file.
The agent OFFERS this choice once the plan is saved (recommending it for
large diffs); the user decides — never a silent default.

In this repo's Cursor default, that is **not** "pay for Opus/Sonnet on the
planner and burn more Sonnet on huge contexts." See
[workflows.md §0 — Model policy](./workflows.md#0-model-policy-cursor):
**Grok** for plan, implement, and review; **Composer 2.5** only as an
optional typist for simple mechanical diffs. Expensive tiers (Sonnet,
Opus/Fable-class, …) stay off the table when token volume is large.

The swarm economics still apply at the *session* level (see
[Cursor's write-up](https://cursor.com/blog/agent-swarm-model-economics)):
workers consume most tokens; keeping the planner context clean for review
matters more than upgrading the model family. *"Few moments in a large task
genuinely require frontier intelligence: the original decomposition, the
design decisions, and certain trade-offs"* — those moments stay with the
planner + human; we just run them on Grok.

The delegate's brief is **artifacts only, never the planning conversation**:
the slice file + the artifacts it explicitly references (parent 🧑 zones,
`CONTEXT.md`/ADRs, prior art) + the repo's ambient layer. Two disciplines
follow (both from Cursor's failure modes):

- **Explicit references beat shared memory.** The Design section must link
  what it relies on — their "compile-checked references" against split-brain;
  our version is: the delegate follows links, not vibes.
- **The planner never implements** — its context stays clean for reviewing
  the delegate's diff against the plan. All completion gates still run; the
  two-axis review is a decorrelated lens by construction (on Grok).

It doubles as a quality measure (dex): if a typist cannot implement the
slice from the persisted design and its references, the design was not
factored well enough — fix the file, not the delegate's context.

## Where dex's phases live (and who owns each)

| dex phase | Our artifact | Produced by | Delegable? |
|---|---|---|---|
| **Product** (why/what/success) | Parent task 🧑 REVIEW CAREFULLY: Context, Scope, Acceptance Criteria | planner session + human (grilling); Grok in Cursor | never |
| **System Architecture** (how the pieces talk) | Parent task **Architecture** section (🧑, medium/large; diagrams > prose) | planner session + human; Grok in Cursor | never |
| **Program Design** (types, signatures, layout, call stacks) | Unsliced task: Implementation Decisions. Sliced task: each slice's **Design** section, persisted at plan time | planner at the plan gate, human approves; Grok in Cursor | never |
| **Vertical Slices** (implementation) | The code, cycle by cycle | Grok default; Composer 2.5 OK for simple typist — ONLY delegable phase | ✅ opt-in |

The delegation boundary is the plan: everything above the line is thinking
(planner + human), everything below is typing. A typist asked to "figure
out" something the Design left open is a planning failure, not an execution
one — the plan goes back to the planner.

Upstream note: Pocock does NOT persist per-ticket program design — his
capture points are `CONTEXT.md`/ADRs (during grilling) and the feature-level
spec (`to-spec`); the design made inside `/implement` dies with the session.
Persist-the-plan is our addition, aligned with dex's "program design is a
human-owned, reviewable artifact".

## Why the time-id prefix

`scripts/task-id.sh` generates `YYYYMMDD-HHmm`. Prefixing task files and slice
folders with it gives automatic chronological sorting in the tree while the
rest of the name carries the intention. Incremental numbers are banned: they
collide across branches and carry no meaning.

## Why the interview comes first (and is a separate skill)

Writing a task file before shared understanding produces confident nonsense.
The `grilling` skill interviews one question at a time with a recommended
answer per question — facts are looked up, decisions are put to the human. The
task file is only written once the human confirms shared understanding.

## Why a two-axis review at completion

A change can follow every standard and implement the wrong thing, or do
exactly what the task asked while breaking conventions. The `code-review`
skill runs **Standards** (documented repo standards + a fixed baseline of
Fowler smells, always judgement calls) and **Spec** (the task file's 🧑 zones
as requirements: anything missing? any scope creep?) as separate axes so one
cannot mask the other.

## Why the CHANGELOG stays

The dated CHANGELOG is the project's narrative memory: agents grep it and read
the recent entries to load context cheaply at session start. It complements —
never replaces — the task archive (structured detail), the living docs
(current state), and the domain memory maintained by the `domain-modeling`
skill: `CONTEXT.md` (the glossary, nothing else) and `docs/adr/` (decisions
that are hard to reverse, surprising without context, AND real trade-offs —
all three or no ADR). The CHANGELOG records the flow; CONTEXT.md and ADRs
crystallize what must survive it.

## Artifact ladder (plans → evergreen)

Working designs and mermaid diagrams start in task/slice files (and Cursor
plans). At completion they must be **promoted** into evergreen product docs
under the documentation reference declared in `.agents/project.md` (default
`doc/**`) **except** the task workspace declared there (default
`/project-management/`: tasks, changelog, temporary baselines, archive).
Prefer `doc/architecture/` for as-built seams and integration diagrams; add
`doc/domain/` when the glossary needs a home. The task workspace is narrative
and planning — not the living architecture. Protocol wording stays generic:
do not brand temporary rewrite labels as if they were part of the work
system.

## The bridge rule (default behaviour)

No task file is created for casual conversations. But every conversation runs
under the work rules (context preamble, plan-first, verify-before-done), and
when a conversation turns into real, multi-step, scoped work, the agent must
recognize it and PROPOSE a task — inform, never force. Formality is opt-in,
detection is not.
