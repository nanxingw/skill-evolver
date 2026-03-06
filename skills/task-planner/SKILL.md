---
name: task-planner
description: "Proactive task scheduling system for Claude Code. Manages recurring and one-shot tasks that run automatically on cron schedules or at specific times. Use this skill when the user wants to schedule automated tasks, create recurring workflows, or set up background jobs that Claude executes independently. Also used during evolution cycles to suggest tasks based on accumulated user memory and experience. Provides buffer/ideas.yaml for lightweight task brainstorming, tasks/*.yaml for active task definitions, and tasks/_rejected.yaml for declined proposals."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Task Planner — Proactive Task Scheduling

This skill manages a task scheduling system that enables Claude Code to run automated tasks — both recurring (cron-based) and one-shot (scheduled for a specific time). Tasks are defined as YAML files, each containing a prompt that Claude executes when the schedule fires.

The skill serves three purposes:

| Mode | When | What happens |
|------|------|-------------|
| **Runtime** | Normal Claude Code session | Help the user create, edit, or inspect tasks interactively |
| **Evolution** | Background evolution cycle | Review user memory and experience to suggest useful tasks |
| **Post-task** | After a task executes | Review task output, evaluate success, update task status |

---

## Data Location

All data files are at `~/.claude/skills/task-planner/`.

### tasks/ — Active Task Definitions

Each task is a separate YAML file named by its ID (e.g., `t_20260306_1530_abc.yaml`). Contains the full task specification including schedule, prompt, status, and run history.

A special file `tasks/_rejected.yaml` tracks task proposals that were declined — prevents the evolution agent from re-proposing the same ideas.

### buffer/ — Idea Accumulator

`buffer/ideas.yaml` holds lightweight task ideas — quick memos from the evolution agent or user. These are not strict proposals; they are a scratchpad. The evolution agent freely adds and removes ideas as context evolves.

### reference/ — Guides

| File | Contents |
|------|----------|
| `reference/runtime_guide.md` | How to help users create and manage tasks during normal sessions |
| `reference/evolution_guide.md` | How the evolution agent suggests and manages tasks |
| `reference/task_schema.md` | Full YAML schema specification for task files |

---

## How to Use This Skill

### During normal work (runtime)

Read `reference/runtime_guide.md` for instructions on how to interactively help the user create tasks, explain the scheduling system, and point them to the dashboard for monitoring.

### During an evolution cycle (background task)

Read `reference/evolution_guide.md` for the operational manual on reviewing ideas, proposing tasks from accumulated memory, and handling post-task review.

### Task YAML format

Read `reference/task_schema.md` for the full task file specification, including field definitions, cron examples, and artifact structure.
