Task list workflow (for docs/tasks.md)

- Location: docs/tasks.md. Keep all project tasks here; mirror docs/plan.md phases.
- Format:
  - Each task line must include a checkbox: use [ ] for open, [x] for done (lowercase x).
  - Keep tasks enumerated by phase numbers (1–15). Place subtasks as indented bullet lines, each with its own checkbox.
  - Do not remove completed tasks; mark them [x] to preserve history.
- Editing rules:
  - When adding new tasks, append them to the appropriate phase without renumbering existing items.
  - If a task splits into smaller items, add new indented subtasks beneath it; keep the parent unchecked until all subtasks are done.
  - Keep lines concise and under ~120 characters. Avoid heavy formatting beyond bullets and checkboxes.
  - Reference related files (e.g., docs/plan.md, docs/requirements.md) in the text when useful.
- Usage:
  - Update the checkbox state as work progresses; include an optional note with date in parentheses, e.g., (done: 2025-09-24).
  - Prefer small, incremental edits to minimize diffs.
  - In commits/PRs, mention the task numbers you touched (e.g., "tasks: 3, 3.2").
- Adding Tasks:
    - Review docs/plan.md to identify the appropriate phase for new tasks.
    - Add tasks to the end of the relevant phase section using the next available number.
    - Format: "[ ] N. Task description" where N is the new task number.
    - Include clear, actionable descriptions that align with project requirements.
    - If adding related tasks, group them under a parent task using indented subtasks.
- Testing Guidelines:
    - For running tests with "npm run dev", ensure the application is always started in background.
    - Never run the application in foreground when executing tests to avoid blocking test execution.
    - Use appropriate background process management based on your OS:
        - Linux/MacOS: Append '&' to run in background
        - Windows: Use 'start' command
    - Clean up background processes after test completion using pkill command.

