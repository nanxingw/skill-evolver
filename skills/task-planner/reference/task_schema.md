# Task Schema Reference

This document defines the YAML format for task files stored in `~/.claude/skills/task-planner/tasks/`.

---

## Task File Format

Each task is a single YAML file named `<id>.yaml`.

```yaml
id: "t_20260306_1530_abc"
name: "Daily lint check"
description: "Run ESLint on the main project every morning before the user starts work"
type: "recurring"
schedule: "0 8 * * *"
prompt: |
  Run ESLint on the project at ~/projects/main-app.
  Report any new warnings or errors since the last run.
  If clean, just confirm "No lint issues found."
model: "sonnet"
source: "user"
status: "active"
approved: true
created_at: "2026-03-06T15:30:00+08:00"
last_run: null
next_run: "2026-03-07T08:00:00+08:00"
run_count: 0
max_runs: null
tags: ["linting", "code-quality"]
memory_ref: null
```

---

## Field Definitions

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier. Format: `t_YYYYMMDD_HHmm_<3-char-random>`. Generated at creation time. |
| `name` | string | Short human-readable name. Keep under 60 characters. |
| `description` | string | Detailed description of what the task does and why. |
| `type` | enum | `"recurring"` (cron-based) or `"one-shot"` (runs once). |
| `schedule` | string | **Recurring only.** Cron expression (5 fields: minute hour day-of-month month day-of-week). |
| `scheduled_at` | string | **One-shot only.** ISO 8601 datetime for when to execute. |
| `prompt` | string | The full prompt given to Claude when the task fires. Must be self-contained — the executing Claude has no other context. |
| `source` | enum | `"user"` (created by user during a session) or `"agent"` (suggested by the evolution agent). |
| `status` | enum | `"active"`, `"paused"`, `"pending"` (awaiting approval), `"inactive"`, `"completed"` (one-shot that has run). |
| `approved` | boolean | Whether the user has approved this task. User-created tasks are `true` by default. Agent-suggested tasks start as `false`. |
| `created_at` | string | ISO 8601 datetime of task creation. |

### Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | string | Config default | Claude model to use for execution (`"opus"`, `"sonnet"`, `"haiku"`). |
| `last_run` | string or null | `null` | ISO 8601 datetime of the most recent execution. Updated by the daemon. |
| `next_run` | string or null | Computed | ISO 8601 datetime of the next scheduled execution. Computed from schedule/scheduled_at. |
| `run_count` | integer | `0` | Total number of times this task has executed. |
| `max_runs` | integer or null | `null` | Maximum executions. `null` = unlimited. `1` = effectively one-shot. After reaching max, status becomes `"completed"`. |
| `tags` | string[] | `[]` | Categorization tags for filtering and display. |
| `memory_ref` | string or null | `null` | For agent-suggested tasks: brief explanation of the reasoning and evidence behind the suggestion. |

---

## Status Lifecycle

```
pending ──(user approves)──> active ──(runs)──> active (recurring)
                                                  └──> completed (one-shot or max_runs reached)
active ──(user pauses)──> paused ──(user resumes)──> active
active ──(deactivated)──> inactive
```

- `pending`: Agent-suggested, awaiting user approval. Will not execute.
- `active`: Approved and scheduled. Will execute on schedule.
- `paused`: Temporarily stopped. Retains schedule but will not execute.
- `inactive`: Permanently stopped. Kept for history.
- `completed`: One-shot that has run, or recurring that hit `max_runs`.

---

## Cron Expression Format

Standard 5-field cron: `minute hour day-of-month month day-of-week`

| Field | Allowed values |
|-------|---------------|
| minute | 0-59 |
| hour | 0-23 |
| day-of-month | 1-31 |
| month | 1-12 |
| day-of-week | 0-7 (0 and 7 are Sunday) |

Special characters: `*` (any), `,` (list), `-` (range), `/` (step).

### Common examples

| Expression | Meaning |
|-----------|---------|
| `0 * * * *` | Every hour on the hour |
| `0 9 * * *` | Daily at 9:00 AM |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 9,18 * * *` | Twice daily at 9:00 AM and 6:00 PM |
| `0 0 * * 0` | Weekly on Sunday at midnight |
| `0 12 1 * *` | Monthly on the 1st at noon |
| `0 */6 * * *` | Every 6 hours |

---

## Artifacts and Run History

When a task executes, the daemon stores output artifacts at:

```
~/.skill-evolver/task-artifacts/<task-id>/
  run_<YYYY-MM-DD_HH-mm>/
    output.md        # Claude's full output from the execution
    metadata.yaml    # Run metadata
```

### metadata.yaml format

```yaml
task_id: "t_20260306_1530_abc"
run_at: "2026-03-07T09:00:12+08:00"
completed_at: "2026-03-07T09:02:45+08:00"
duration_seconds: 153
model: "sonnet"
exit_code: 0
prompt_tokens: 1240
output_tokens: 856
error: null
```

---

## _rejected.yaml Format

Tracks declined task proposals to prevent re-suggestion.

```yaml
entries:
  - name: "Auto-format on save"
    reason: "User prefers manual formatting control"
    rejected_at: "2026-03-06"
    original_source: "agent"
  - name: "Weekly backup reminder"
    reason: "User already has Time Machine configured"
    rejected_at: "2026-03-05"
    original_source: "agent"
```

The evolution agent must check this file before proposing new tasks to avoid duplicating rejected ideas.
