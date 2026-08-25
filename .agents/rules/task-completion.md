# Task completion

Task completion is met by:

- Running lint, tests, and build to ensure the code is working as expected.
- Checking the work with the browser when UI behavior changed.
- Running a **two-axis review** of the changes — use the `code-review` skill
  ([../skills/code-review/SKILL.md](../skills/code-review/SKILL.md)):
  **Standards** (does the code follow this repo's documented standards and avoid
  the baseline code smells?) and **Spec** (does the code match what the task
  file asked for — nothing missing, no scope creep?). Fix or report the
  findings before declaring the task complete.
- Re-checking your work to ensure you cleaned up your code and your work is
  complete.

After completing a task, update the task file to reflect completion (Status →
🟢 Complete, acceptance criteria checked off), then move it from @tasks folder
to the archive declared in `.agents/project.md` (default
`/project-management/archive/`).

Plus, let's update the changelog declared in `.agents/project.md` (default
`/project-management/CHANGELOG.md`) to reflect our thoughts. Always add a date
when adding a new line.

Then update the roadmap declared in `.agents/project.md` (default
`/project-management/ROADMAP.md`) only when it exists and a roadmap-level
change was made. The roadmap is under the user's responsibility.

Finally, update **evergreen product docs** under the documentation reference
declared in `.agents/project.md` (default `doc/**`) **except** the task
workspace declared there (default `/project-management/`: tasks, changelog,
temporary baselines, and archive are not living architecture). Prefer
`doc/architecture/` for as-built seams,
state machines, and integration diagrams; create `doc/domain/` only when the
glossary / domain model needs a home. Promote decision-rich diagrams and seam
contracts from the task/slice Design into those pages so they reflect the
current code — do not leave them only in plans or archived tasks. Start from
the architecture index (default: `doc/architecture/ARCHITECTURE.md`). Also
update the repo `README.md` when the change is relevant to it.

Protocol and evergreen pages must not brand temporary rewrite labels (e.g.
“v2”) as if they were part of the generic work system.
