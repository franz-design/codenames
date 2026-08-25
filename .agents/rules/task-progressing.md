# Task work rules

IMPORTANT: Those rules also apply to simple, one-shot tasks without a task file.
The only difference is that you will not update the task file in @tasks folder.

Always read the [README.md](../../README.md) file to get an overview of the
project and the tasks and our work history.

Also, read the changelog declared in `.agents/project.md` (default
`/project-management/CHANGELOG.md`) to get an overview of the project and the
tasks and our work history.

When the user says `work on task <file>` or `work on slice <file>` (the
normal way a build session starts — fresh context, working from the file):
read the file fully first, plus the files it links to (parent task, prior
art). Update its Status, and read its 🧑 zones carefully — they are the
human's decisions and constraints. Never contradict them silently: if
implementation reveals a conflict with a 🧑 zone, stop and surface it.

Then, always plan your work first (planning mode in Cursor). Then, once agreed
on the plan, **persist it before writing code**: copy the plan's decision-rich
parts into the task/slice file — the "Design" section for slices, the
Implementation Decisions / Notes zones otherwise: decisions locked, target
shape (file tree), seam methods, state diagrams, migration notes, TDD order.
Include a short **Architecture docs (evergreen)** subsection listing the
`doc/architecture/` (or later `doc/domain/`) paths to create or update at
completion — never inside the task workspace declared in `.agents/project.md`.
A plan that lives only in the
conversation is invisible to the completion review (its Spec axis reads the
file), to dependent slices, and to re-runs. Then you can start working on the
task (Agent mode in Cursor).

**Models (Cursor):** default to **Grok** for plan, implement, review, and
sub-agents. **Composer 2.5** is OK only for simple typist-only diffs. Do
**not** spawn Sonnet / Opus / other expensive tiers when context or tokens
are large. Policy SSOT:
[workflows.md §0](../workflows.md#0-model-policy-cursor).

**Delegation — offer it, user decides:** once the plan is persisted, OFFER
the user the choice of typist before writing code: (a) keep typing in this
session (Grok), or (b) hand the typing to a typist sub-agent (Grok by
default; Composer 2.5 for simple mechanical work) — recommend (b) for large
diffs so this session stays clean to review. Never delegate without the
user's yes. The delegate's brief is **artifacts only, never the planning
conversation**:

- the slice file (the persisted Design section is the core of the brief),
- the artifacts it explicitly references — parent task 🧑 zones, `CONTEXT.md`
  / ADRs, prior-art file paths cited in Design/References,
- the ambient layer any session in this repo gets (README, rules, changelog).

Consequence for the planner: the Design section must **cite its references
explicitly** (link the parent task, the prior-art specs, the glossary terms it
relies on) — the delegate follows links, not vibes. The planning agent never
implements (context stays clean for review); it reviews the delegate's diff
against the plan on **Grok**, and the completion gates (tests, two-axis
review) still run. If the delegate cannot implement from those artifacts,
treat it as a finding: the persisted design or its references were
insufficient — fix the file, not the delegate's context.

**The delegation boundary is the plan.** Product intent, system architecture
(parent task) and program design (the slice plan) are planner work — produced
with the human, never by the typist. The typist only types against a finished
design. Never ask the typist to plan, design, or "figure out" anything the
Design section left open; if something is open, the plan goes back to the
planner.

While implementing:

- Work in **vertical slices** (as listed in the task file), never
  layer-by-layer. Something must be demoable/verifiable at each step.
- Prefer **test-driven development at the seams agreed in the task file** —
  use the `tdd` skill
  ([../skills/tdd/SKILL.md](../skills/tdd/SKILL.md)): red
  before green, one seam / one test / one minimal implementation per cycle.
  Tests verify behavior through public interfaces, never implementation
  details.
- Run typechecking regularly, single test files regularly, and the full test
  suite once at the end.

Product baselines and planning drafts (temporary) live in the task workspace
declared in `.agents/project.md` (default `/project-management/`), including
any rewrite baseline folders. Active execution tasks live in the tasks
directory declared there (default `/project-management/tasks/`). Evergreen
as-built docs live under the documentation reference declared in
`.agents/project.md` (default `doc/**`), outside the task workspace — default
index: `doc/architecture/ARCHITECTURE.md`.
