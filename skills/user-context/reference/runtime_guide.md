# User Context — Runtime Guide

When you are assisting the user in a normal Claude Code session, use the stored user context to **personalize your behavior**. This guide explains how.

---

## 1. When to Consult User Context

- **At the start of a session** or when you first encounter this skill — read the `context/` files to understand who you are working with.
- **When making a choice** about response style, tool usage, language, or approach — check if the user has a confirmed preference.
- **When the user seems frustrated or confused** — review cognition entries to adapt your communication style.
- **When planning a task** — check objective entries for current project context and goals.

---

## 2. How to Read the Data

All files are at `~/.claude/skills/user-context/`.

### Confirmed knowledge (prioritize these)

Read the three `context/` YAML files:

```
context/preference.yaml   — User's confirmed preferences
context/objective.yaml    — User's confirmed goals and projects
context/cognition.yaml    — User's confirmed cognitive patterns
```

Each entry has:
- `content`: A clear statement about the user (e.g., "User communicates exclusively in Simplified Chinese")
- `graduated`: When this was confirmed
- `source_signals`: How many observations supported this
- `last_validated`: When the last supporting evidence was seen

**Higher `source_signals` = stronger confidence.** An entry with 14 signals is very well-established.

### Emerging observations (use with caution)

Read the three `tmp/` YAML files for patterns that are accumulating but not yet confirmed:

```
tmp/preference_tmp.yaml
tmp/objective_tmp.yaml
tmp/cognition_tmp.yaml
```

These are weaker signals. Use them as soft hints, not hard rules. For example, if a tmp entry says "User prefers Opus model" with only 1 signal, don't assume it's a permanent preference — but you can mention it if relevant.

---

## 3. How to Apply the Context

### Preference entries

Directly apply confirmed preferences to your behavior:

| Example preference | How to apply |
|---|---|
| "User communicates in Simplified Chinese" | Respond in Chinese |
| "User expects documentation updated alongside code" | Update docs when changing code |
| "User prefers spawning multi-agent teams for complex tasks" | Suggest team mode for large tasks |
| "User follows DDD architecture" | Organize code by domain |

### Objective entries

Use objectives to understand the bigger picture:

- Reference the user's current projects when discussing related topics
- Align suggestions with the user's stated goals
- Avoid suggesting approaches that conflict with their direction

### Cognition entries

Adapt your communication style:

| Example cognition | How to adapt |
|---|---|
| "Short directives, impatient with repetition" | Be concise, no fluff, get to the point |
| "Systems-architecture thinker" | Frame discussions at the architecture level |
| "Validates work visually with screenshots" | Offer to take screenshots or show visual results |

---

## 4. Session History Search (Runtime)

When you need context from **past sessions** during normal work — for example, to recall a previous decision, find how a problem was solved before, or check what was discussed — use the search scripts at `~/.claude/skills/user-context/scripts/`.

### When to Use

- User asks "what did we do last time about X?" or "remember when we..."
- You need to understand prior decisions before making changes to a codebase
- User references a past conversation or session
- You want to check if a similar problem was solved before

### Quick Reference

```bash
# Find recent sessions for this project
node ~/.claude/skills/user-context/scripts/list-sessions.mjs --project <name> --limit 5

# Search for a keyword across all sessions
node ~/.claude/skills/user-context/scripts/search-messages.mjs --query "migration|database" --limit 10

# Get the conversation text from a specific session
node ~/.claude/skills/user-context/scripts/session-digest.mjs --file <path>

# Quick stats about a session
node ~/.claude/skills/user-context/scripts/session-stats.mjs --file <path>

# See what tools were used and what failed
node ~/.claude/skills/user-context/scripts/extract-tool-flow.mjs --file <path> --compact
```

### Typical Runtime Flow

1. `search-messages.mjs --query <keyword>` → find relevant past messages quickly
2. If you need more context, use the `session_id` / `path` from the results to run `session-digest.mjs` on that specific session
3. Use this context to inform your current response — but always prioritize the user's current instructions over past patterns

### Notes

- These scripts are **read-only** — they never modify session history
- A 224MB session file processes in ~1 second, so there is no performance concern
- Output is NDJSON (one JSON object per line), pipe-friendly for further processing
- Use `--limit` to avoid overwhelming output when searching across many sessions

---

## 5. Important Rules

- **Do not modify** any context or tmp files during normal runtime. Modifications are only performed during evolution cycles.
- **Do not over-rely on tmp entries.** They are unconfirmed observations. Only context entries should drive behavior changes.
- **Respect contradictions.** If the user explicitly asks for something that contradicts a stored preference, follow the user's current instruction. The evolution cycle will handle updating the records later.
- **Do not mention the evolution system** to the user unless they ask about it. Just silently apply the knowledge.
