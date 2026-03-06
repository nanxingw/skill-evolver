# Task Planner — Runtime Guide

When you are assisting the user in a normal Claude Code session and they want to schedule a task, use this guide to walk them through it interactively.

---

## 1. When This Skill Applies

- User asks to schedule, automate, or repeat a task
- User wants something to run periodically in the background
- User asks about existing scheduled tasks
- User wants to create a one-shot delayed task ("remind me to..." or "run this tomorrow at...")

---

## 2. Interactive Task Creation

Walk the user through these fields conversationally. Do not dump all fields at once — ask step by step.

### Required fields

1. **Name** — A short, human-readable name. Ask: "What should we call this task?"
2. **Type** — `recurring` (runs on a cron schedule) or `one-shot` (runs once at a specific time). Ask: "Should this run repeatedly or just once?"
3. **Schedule** — For recurring: a cron expression. For one-shot: an ISO datetime. Ask: "When should it run?" and help translate natural language into cron (see Section 4).
4. **Prompt** — The full prompt given to Claude when the task fires. Ask: "What should Claude do when this runs?" Help the user write a clear, self-contained prompt.

### Optional fields

5. **Model** — Which Claude model to use. Defaults to the config model (usually `sonnet`). Only ask if the user has a preference.
6. **Tags** — Categorization tags. Suggest relevant ones based on the task description.
7. **Max runs** — For recurring tasks, a maximum number of executions. `null` means infinite. Only mention for tasks that clearly should stop after N runs.

### Defaults (do not ask)

- `id`: Auto-generated as `t_YYYYMMDD_HHmm_<3-char-random>`
- `source`: `"user"` (since this is user-initiated)
- `status`: `"active"`
- `approved`: `true` (user-created tasks are pre-approved)
- `created_at`: Current ISO datetime
- `last_run`: `null`
- `next_run`: Computed from schedule
- `run_count`: `0`
- `memory_ref`: `null` (only used for agent-suggested tasks)

---

## 3. Writing the Task File

After gathering input, write a YAML file to `~/.claude/skills/task-planner/tasks/` named `<id>.yaml`.

See `reference/task_schema.md` for the full schema.

Example complete task file:

```yaml
id: "t_20260306_1530_k7x"
name: "Daily test suite"
description: "Run the full test suite for the main project every morning"
type: "recurring"
schedule: "0 9 * * *"
prompt: |
  Run the full test suite for the project at ~/projects/main-app.
  Report any failures with file paths and error messages.
  If all tests pass, just confirm the count.
model: "sonnet"
source: "user"
status: "active"
approved: true
created_at: "2026-03-06T15:30:00+08:00"
last_run: null
next_run: "2026-03-07T09:00:00+08:00"
run_count: 0
max_runs: null
tags: ["testing", "ci"]
memory_ref: null
```

---

## 4. Cron Expression Reference

Help the user translate natural language into cron. The format is `minute hour day-of-month month day-of-week`.

| User says | Cron expression |
|-----------|----------------|
| "Every hour" | `0 * * * *` |
| "Every day at 9am" | `0 9 * * *` |
| "Every Monday at 10am" | `0 10 * * 1` |
| "Every weekday at 8:30am" | `30 8 * * 1-5` |
| "Every 30 minutes" | `*/30 * * * *` |
| "First day of every month at noon" | `0 12 1 * *` |
| "Every Sunday at midnight" | `0 0 * * 0` |
| "Every 6 hours" | `0 */6 * * *` |
| "Twice a day (9am and 6pm)" | `0 9,18 * * *` |

For one-shot tasks, use `scheduled_at` with an ISO datetime instead of `schedule`.

---

## 5. Managing Existing Tasks

### Listing tasks

Read all `.yaml` files in `~/.claude/skills/task-planner/tasks/` (excluding `_rejected.yaml`) to show the user their scheduled tasks.

### Editing a task

Read the task file, make the requested changes with Edit, and confirm with the user.

### Pausing/resuming

Set `status: "paused"` to pause, `status: "active"` to resume.

### Deleting

Remove the task file. If the user might want it back, move the content to `_rejected.yaml` instead.

---

## 6. Dashboard

After creating or modifying tasks, inform the user they can monitor task execution from the web dashboard at **http://localhost:3271**. The dashboard shows:

- All scheduled tasks and their next run times
- Task execution history and outputs
- Ability to manually trigger tasks
- Real-time status updates

If the daemon is not running, remind them to start it: `skill-evolver start`.

---

## 7. Important Rules

- **Do not execute tasks during runtime.** Only create, edit, or inspect task definitions. The daemon handles execution.
- **Always confirm the prompt with the user** before writing the file. The prompt is what Claude will see — make sure it is clear and self-contained.
- **Validate cron expressions.** If unsure, tell the user what the schedule means in plain language before saving.
- **Do not modify buffer/ideas.yaml** during runtime. That file is for the evolution agent.
