<h1 align="center">AutoCode</h1>

<p align="center">
  <strong>Self-evolving intelligence for Claude Code — skills, memory, and autonomous tasks.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/autocode-cli"><img src="https://img.shields.io/npm/v/autocode-cli.svg" alt="npm version"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/autocode-cli.svg" alt="Node.js"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

**Two commands. Your Claude Code starts evolving.**

```bash
npm install -g autocode-cli
autocode start
```

AutoCode runs in the background — reviewing your past sessions, building long-term memory, creating reusable skills, and scheduling autonomous tasks — all without manual intervention.

## The Problem

Claude Code is powerful, but it doesn't learn. Every session starts from zero. Failed approaches repeat, successful patterns are forgotten, user preferences must be re-explained. The built-in skill system exists, but skills don't write themselves.

## What AutoCode Does

AutoCode is a background daemon that periodically spawns Claude Code instances to reflect on your conversation history. Three specialized agents run in parallel:

```
┌──────────────────────────────────────────────────────────────┐
│                        AutoCode                              │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   Context    │  │    Skill    │  │    Task     │        │
│   │   Agent      │  │    Agent    │  │    Agent    │        │
│   │             │  │             │  │             │        │
│   │ Who is the  │  │ What skills │  │ What tasks  │        │
│   │ user?       │  │ are needed? │  │ should run? │        │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│          │                │                │                │
│          ▼                ▼                ▼                │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ Preferences │  │  New Skills │  │ Scheduled   │        │
│   │ Objectives  │  │  Experience │  │ Tasks       │        │
│   │ Cognition   │  │  Evolution  │  │ Automation  │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│   ◄──────── Task-Skill Co-Evolution Loop ────────►          │
│   Tasks fail → skill-need signal → Skill Agent creates      │
│   skill → Tasks leverage skill → better execution           │
└──────────────────────────────────────────────────────────────┘
```

### Context Agent — Long-term Memory

Maintains a persistent user profile across three pillars:

- **Preference** — tool choices, code style, communication preferences
- **Objective** — current projects, goals, career direction
- **Cognition** — personality traits, decision patterns, communication style

Signals accumulate in `tmp/` and graduate to confirmed knowledge only with strong evidence (3+ sessions, 2+ days).

### Skill Agent — Need-driven Skill Creation

Actively discovers unmet needs and creates skills to address them:

1. Analyzes user objectives, preferences, experience, session logs, and **task execution patterns**
2. Searches external sources (SkillHub, GitHub, Anthropic official)
3. Creates or evolves skills using [skill-creator](https://github.com/anthropics/claude-code/tree/main/plugins/skill-creator) methodology
4. Responds to **skill-need signals** from failed tasks as priority needs

### Task Agent — Autonomous Task Scheduling

Decomposes user objectives into actionable automated tasks:

- **Information gathering** — news, trends, research summaries
- **Quality checks** — linting, type-checking, dependency audits
- **Monitoring** — progress tracking, status reports
- **Skill-building** — tasks that create or improve skills, closing the co-evolution loop

## Co-Evolution: Tasks and Skills Reinforce Each Other

AutoCode's unique feature is the **task-skill co-evolution loop**:

```
User Objectives → Task Agent creates tasks → Tasks execute
       ↑                                          ↓
  Skills enhance                           Results & failures
  task execution                                  ↓
       ↑                                  Post-task review
  Skill Agent ◄──── skill-need signals ◄── emits signals
```

- When a task struggles or fails, the post-task review emits a **skill-need signal**
- The Skill Agent picks up these signals and creates skills to prevent future failures
- Tasks declare **related skills** (`relatedSkills` field) so executors leverage existing knowledge
- The Task Agent can create **skill-building tasks** — tasks whose purpose is to create new skills

## Getting Started

### Install

```bash
npm install -g autocode-cli
```

This automatically:
- Installs the AutoCode CLI
- Copies three meta-skills (user-context, skill-evolver, task-planner) to `~/.claude/skills/`
- Installs [skill-creator](https://github.com/anthropics/claude-code/tree/main/plugins/skill-creator) from the official Anthropic repo

### Prerequisites

- Node.js >= 18
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

### Usage

```bash
# Start the daemon (background + web dashboard)
autocode start

# Run a single evolution cycle
autocode evolve

# Open the dashboard
autocode dashboard

# Check status
autocode status

# Stop the daemon
autocode stop
```

### Web Dashboard

Available at `http://localhost:3271`:

- **Dashboard** — live status, real-time evolution output, manual trigger
- **Tasks** — create, manage, and monitor autonomous tasks
- **Reports** — complete history of evolution cycle reports
- **Data Browser** — browse all 6 data pillars (user context + technical experience)
- **Skills** — view evolved skills inventory
- **Settings** — configure interval, model, evolution mode, auto-run

Real-time updates via WebSocket.

## Configuration

Stored in `~/.skill-evolver/config.yaml`.

| Option | Default | Description |
|--------|---------|-------------|
| `interval` | `1h` | Time between evolution cycles |
| `model` | `opus` | Claude model for evolution agents |
| `evolutionMode` | `multi` | `"multi"` (3 parallel agents) or `"single"` (backward compat) |
| `autoRun` | `true` | Auto-run cycles on interval |
| `taskAutoApprove` | `true` | Agent-created tasks auto-approved or need user approval |
| `port` | `3271` | Web dashboard port |
| `maxReports` | `50` | Max evolution reports to keep |
| `reportsToFeed` | `5` | Recent reports fed as context to agents |

CLI configuration:

```bash
autocode config set interval 30m
autocode config set model sonnet
autocode config set evolutionMode single
autocode config get
```

## Architecture

### Three Meta-Skills

AutoCode installs three skills into `~/.claude/skills/` that serve dual purposes — providing context during normal Claude Code sessions and guiding background evolution:

| Skill | Runtime Purpose | Evolution Purpose |
|-------|----------------|-------------------|
| **user-context** | Personalize responses using confirmed user profile | Context Agent extracts and graduates user signals |
| **skill-evolver** | Avoid known pitfalls, apply proven approaches | Skill Agent discovers needs, creates/evolves skills |
| **task-planner** | Help users create and manage tasks | Task Agent decomposes objectives, schedules automation |

### Evidence-Based Evolution

AutoCode uses an **accumulate-then-graduate** approach to prevent premature conclusions:

1. **Signals** extracted from session logs, tagged with session ID and date
2. **Accumulation** in `tmp/` YAML files with deduplication
3. **Graduation** only with 3+ signals spanning 2+ days, no contradictions
4. **Staleness** auto-cleaned — 60+ day entries with few signals removed

### File Structure

```
~/.claude/skills/
  user-context/                 # User profile (preference, objective, cognition)
    SKILL.md
    context/                    # Graduated knowledge
    tmp/                        # Accumulating signals
    scripts/                    # Session search tools (5 scripts)

  skill-evolver/                # Technical experience + skill creation
    SKILL.md
    reference/permitted_skills.md
    tmp/                        # Experience + skill_needs.yaml

  task-planner/                 # Task scheduling
    SKILL.md
    buffer/ideas.yaml
    reference/                  # Task schema + guides

  skill-creator/                # Official Anthropic skill creation tool

~/.skill-evolver/
  config.yaml                   # Configuration
  reports/                      # Evolution cycle reports
  tasks/
    tasks.yaml                  # Central task store
    <task-id>/artifacts/        # Persistent task artifacts
    <task-id>/reports/          # Per-task execution reports
```

## Documentation

Detailed Chinese documentation available in `docs/`:

- [System Architecture](docs/system-architecture.md) — complete system design and data flow
- [user-context Skill](docs/skill-user-context.md) — three pillars, graduation mechanism, session scripts
- [skill-evolver Skill](docs/skill-skill-evolver.md) — need-driven workflow, skill-creator integration
- [task-planner Skill](docs/skill-task-planner.md) — task lifecycle, skill-building tasks, safety tiers

## Roadmap

- [ ] **Config migration** — migrate `~/.skill-evolver/` to `~/.autocode/`
- [ ] **Multi-CLI support** — extend beyond Claude Code to support Codex, Gemini CLI, and other AI coding agents
- [ ] **Richer information sources** — ingest browser history, Git commit logs, and IDE activity
- [ ] **Cross-machine sync** — optional cloud sync for user context and evolved skills
- [ ] **Skill marketplace** — share and discover community-created evolved skills

## License

MIT
