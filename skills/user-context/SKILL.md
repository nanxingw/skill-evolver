---
name: user-context
description: "User profile and preferences knowledge base. Contains confirmed user preferences (tools, code style, communication), objectives (current projects, career goals), and cognitive patterns (personality, decision-making style). Read context/ files to personalize responses; read tmp/ files for emerging patterns. Use this skill whenever you need to understand the user's habits, goals, or communication preferences. Includes session history search scripts (scripts/) for querying past Claude Code conversations by keyword, time, or project."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# User Context — Living User Profile

This skill maintains a structured, evidence-based profile of the user across three pillars, and provides **session history search tools** for querying past Claude Code conversations.

| Pillar | File | What it captures |
|--------|------|-----------------|
| **Preference** | `context/preference.yaml` | Tool choices, code style, communication preferences, workflow habits |
| **Objective** | `context/objective.yaml` | Current projects, short/long-term goals, recurring themes |
| **Cognition** | `context/cognition.yaml` | Personality traits, communication style, decision-making patterns |

Each pillar also has a `tmp/<pillar>_tmp.yaml` file that holds **emerging observations** — patterns that have been seen but not yet confirmed with enough evidence.

---

## Data Location

All data files are at `~/.claude/skills/user-context/`.

### context/ — Confirmed Knowledge (high confidence)

Entries here have been observed across **3+ sessions spanning 2+ days**. Treat these as reliable facts about the user.

```yaml
# Example entry in context/preference.yaml
entries:
  - content: "User communicates with Claude exclusively in Simplified Chinese"
    graduated: "2026-03-04"
    source_signals: 14
    last_validated: "2026-03-04"
```

### tmp/ — Emerging Observations (accumulating)

Entries here are being tracked but lack enough evidence. They may or may not reflect stable patterns.

```yaml
# Example entry in tmp/preference_tmp.yaml
entries:
  - content: "User prefers Opus model for important tasks"
    signals:
      - session: "cad1c7e9"
        date: "2026-03-04"
        detail: "User explicitly stated preference for Opus model"
    first_seen: "2026-03-04"
    last_seen: "2026-03-04"
    times_seen: 1
```

### scripts/ — Session History Search Tools

Streaming search scripts for querying past Claude Code session logs. Raw JSONL files can be 200MB+ with 99% noise — these scripts extract only useful conversation data.

| Script | Purpose |
|--------|---------|
| `list-sessions.mjs` | Find sessions by date/project, sorted by recency |
| `session-digest.mjs` | Extract user text + assistant text only (224MB → ~500KB in ~1s) |
| `search-messages.mjs` | Regex keyword search across all sessions |
| `extract-tool-flow.mjs` | Tool usage sequence with error detection |
| `session-stats.mjs` | Quick session statistics (duration, tool counts, errors) |

---

## How to Use This Skill

### During normal work (runtime)

Read `reference/runtime_guide.md` for instructions on how to leverage the stored user profile and session history search to personalize your responses and recall past context.

### During an evolution cycle (background task)

Read `reference/evolution_guide.md` for the full operational manual on scanning session logs, adding signals, graduating entries, and handling contradictions.
