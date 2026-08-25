# Task File Template & Standards

**Status:** 🟢 Complete
**Version:** 2 (reading-gradient template — fused with Matt Pocock's skills patterns; see [.agents/methodology.md](/.agents/methodology.md))

## Context

Task files are the single work artifact of this project. Each task is
self-contained, clearly scoped, and traceable from planning to completion.

Version 2 introduces the **reading gradient**: sections are ordered by review
criticality, and explicit zone markers tell the human reviewer what to read
carefully, what to read if relevant, and what is agent working space. Detail is
never cut — it is ordered. Only the top must stay short.

## The three zones

| Zone | Who reads it | What belongs there |
|---|---|---|
| 🧑 **REVIEW CAREFULLY** | Human, always, before any code | Problem, scope, acceptance criteria, seams — the decisions that are expensive to change later |
| 🧑 **REVIEW IF RELEVANT** | Human, for medium/large tasks | Program design: implementation decisions, testing strategy, slicing |
| 🤖 **AGENT ZONE** | Agent; human skims at most | Detailed deliverables, worklog, snippets, references |

Rules:

- The 🧑 REVIEW CAREFULLY zone must fit in working memory. Prefer a diagram or
  a mockup over three paragraphs.
- The 🧑 zones are the human's decisions. The agent must not contradict them
  silently — if implementation reveals a conflict, stop and surface it.
- The 🤖 zone may be verbose. That is fine; it is not meant to be read line by line.

For where each kind of content lives depending on the task shape (task alone
vs task + slices), see the "where lives what" section and diagrams in
[.agents/workflows.md](/.agents/workflows.md).

## Task File Template

All task files MUST follow this structure:

```markdown
# <Task name>

**Status:** [Status Emoji & Text]

---

> 🧑 **REVIEW CAREFULLY** — human decision surface. Read it all before any code. Keep it short.

## Context

Brief explanation (2-4 sentences) of the problem this task solves, from the
user's/product perspective. Include relevant background. If UI is involved,
prefer a rough mockup or screenshot over prose.

## Scope

**Included:**
- Bullet list of what IS in scope — specific deliverables, features, behaviors

**Not Included:**
- Bullet list of what is NOT in scope — prevents scope creep, clarifies
  boundaries with related tasks

## Acceptance Criteria

How do we know this task is complete? Every criterion must be
machine-verifiable: a command to run, or a Given/When/Then scenario. No prose
criteria.

- [ ] Criterion 1 (testable/verifiable)
- [ ] Criterion 2 (testable/verifiable)
- [ ] All tests pass, no linter errors

## Seams

The public boundaries where this feature will be tested — agreed with the human
BEFORE implementation. Prefer existing seams; the fewer the better (ideal: one).
Tests live at seams, never against internals.

- Seam 1: <interface / boundary> — <what behavior is observed there>

## Architecture (medium/large tasks — omit for small ones)

**System design**: how the pieces talk — services, endpoints, schemas, queues,
stores, and the relationships between them. Prefer diagrams over prose:
sequence diagrams, contract shapes, data models (mermaid). This is a human
decision surface — it must be reviewed before any slicing.

---

> 🧑 **REVIEW IF RELEVANT** — program design (medium/large tasks).

## Implementation Decisions

**Program design** for unsliced tasks: decisions, not descriptions — modules
built/modified and their interfaces, schema changes, API contracts, edge cases
to handle. For SLICED tasks, per-slice program design lives in each slice's
**Design** section, persisted at plan time by the implementing session; this
section then only carries the cross-slice decisions.
Avoid file paths — they go stale fast. Snippets belong in the agent zone;
exception: a snippet that encodes a decision more precisely than prose can
(state machine, schema, type shape) may be inlined here, trimmed to the
decision-rich parts.

## Testing Strategy

- What will be tested at each seam, in natural language
- Only external behavior, never implementation details
- Prior art: similar tests in the codebase
- Unit / integration split, manual testing steps, edge cases to verify

## Slices & Dependencies

For large tasks: vertical slices (tracer bullets). Each slice cuts a narrow but
COMPLETE path through every layer and is demoable on its own — never a
horizontal layer-by-layer plan.

- **Slices:** 1. <slice> (blocked by: none) · 2. <slice> (blocked by: 1) · …

Wide mechanical refactors are the exception: sequence them as
expand → migrate (batched) → contract instead of forcing vertical slices.

Related tasks (links to the task files, including archived ones):

- **Depends on:** tasks that MUST be done first
- **Blocks:** tasks that cannot start until this is done
- **Related:** tasks that interact with this one

---

> 🤖 **AGENT ZONE** — working space; humans skim or skip.

## Deliverables

Concrete outputs that must exist when the task is complete:
- [ ] Specific file paths
- [ ] Test files
- [ ] Documentation updates

## Notes & Snippets

Detailed implementation notes, code snippets, exploration findings, worklog.
May be verbose.

## References

Links to relevant docs sections, external documentation, issues, examples.
```

## File Naming Conventions

Name tasks with a **time identifier prefix** (automatic chronological sorting
in the tree) followed by the **intention** in kebab-case. No incremental
numbers. Generate the name with the script:

```bash
scripts/task-id.sh <intention>   # -> 20260803-1445-<intention>
```

the task workspace declared in `.agents/project.md` (default
`/project-management/tasks/`), as
`<YYYYMMDD-HHmm>-<intention-in-kebab-case>.md`

Examples:

- `20260803-1445-fix-filename-sanitization.md`
- `20260804-0910-beets-import-correlation.md`
- `20260812-1130-requester-one-shot-flow.md`

If a task is split into slices tracked as separate files, group them in a
folder carrying the same prefix:
`tasks/<YYYYMMDD-HHmm>-<feature-slug>/<NN>-<slice-slug>.md`, slices numbered
from `01` in dependency order (blockers first).

## Status Indicators

| Status | Emoji | Meaning |
|--------|-------|---------|
| Not Started | 🔴 | Task not yet begun |
| In Progress | 🟡 | Active development |
| Blocked | 🟠 | Waiting on dependencies |
| Complete | 🟢 | All acceptance criteria met |
| Deferred | ⚪ | Postponed |
| Cancelled | ⚫ | No longer needed |

Completed tasks are moved to the archive declared in `.agents/project.md`
(default `/project-management/archive/`).

## When Creating New Tasks

1. **Interview first** — reach shared understanding before writing (see
   `task-creation` rule)
2. **Agree the seams** with the human before writing the file
3. **Fill the 🧑 zones carefully** — they are the review surface
4. **Keep the top short** — detail goes down the gradient, not deleted
5. **Update status** as work progresses; check off criteria as completed

## When Reviewing Tasks (human)

- Read 🧑 REVIEW CAREFULLY entirely — this is your decision surface
- Read 🧑 REVIEW IF RELEVANT for medium/large tasks
- Skim 🤖 AGENT ZONE or skip it
- Check that acceptance criteria are machine-verifiable and seams are right
