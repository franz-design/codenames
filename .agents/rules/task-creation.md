
# Task Creation Rules

## When the user asks to create a task

1. **Interview first — use the `grilling` skill**
   ([../skills/grilling/SKILL.md](../skills/grilling/SKILL.md)):
   one question at a time, provide your recommended answer with each question,
   look up facts yourself, put decisions to the user. Do not write the task
   file until the user confirms shared understanding.

   Run the **`domain-modeling` skill**
   ([../skills/domain-modeling/SKILL.md](../skills/domain-modeling/SKILL.md))
   underneath the interview: challenge fuzzy terms against `CONTEXT.md`, update
   the glossary the moment a term is resolved, and offer an ADR only when a
   decision is hard to reverse, surprising without context, AND a real
   trade-off. If a design question can't be settled on paper, propose a detour
   through the `prototype` skill.

2. **Sketch the seams.** Identify the public boundaries where the feature will
   be tested (see the `tdd` skill,
   [../skills/tdd/SKILL.md](../skills/tdd/SKILL.md)). Prefer
   existing seams over new ones; the fewer the better (ideal: one). Confirm
   them with the user.

3. **Write the task file** following the task file template declared in
   `.agents/project.md` (default `/project-management/000-task-file-template.md`).
   Respect the reading gradient: 🧑 zones short and decision-rich, detail in the
   🤖 zone. Generate the file name with `scripts/task-id.sh <intention>` →
   `<time-id>-<intention>.md`, created in the task workspace declared in
   `.agents/project.md` (default `/project-management/tasks/`) — sortable by
   creation time, named by intention, no incremental numbers. Historical
   tasks live in the archive declared there (default
   `/project-management/archive/`).

4. **Sizing check (ALWAYS, for every task).** Ask yourself: does this task fit
   in a single fresh context window AND end in one demoable/verifiable pass?
   State your answer and recommendation to the user explicitly — never decide
   silently.
   - **Yes** → the task is its own single slice; no breakdown artifact. Do NOT
     create a slice folder for it.
   - **No** → slice it with the `slice-task` skill
     ([../skills/slice-task/SKILL.md](../skills/slice-task/SKILL.md)):
     tracer-bullet vertical slices with blocking edges, granularity approved by
     the user, one file per slice in the task folder.

   The user arbitrates in both cases.

5. **Update the changelog.** Add a dated line to the changelog declared in
   `.agents/project.md` (default `/project-management/CHANGELOG.md`)
   reflecting the task creation.

6. **Stop — do NOT start implementing in this session.** Tell the user to
   open a FRESH session and say `work on task <file>` (or, for a sliced task,
   `work on slice <file>` on any slice whose "Blocked by" list is done).
   The build must work from the file alone; if it can't, the file is what
   needs fixing.

## Default behaviour (no task file)

Do NOT create a task file for casual conversations or one-shot work. But if a
conversation turns into real, multi-step, scoped work, recognize it, inform the
user, and PROPOSE creating a task — never force it.
