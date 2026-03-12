---
name: evermem
description: "EverMemOS-powered long-term memory for Claude Code. Provides two tools: (1) add-memories — extracts user/assistant messages from Claude session logs and stores them in EverMemOS cloud memory, (2) search-memories — semantic search across all stored memories using keyword, vector, or hybrid retrieval. Requires EVERMEMOS_API_KEY environment variable. Use this skill to persist important conversation context across sessions and retrieve relevant past knowledge."
allowed-tools:
  - Read
  - Bash
  - Glob
---

# EverMem — Cloud Long-Term Memory via EverMemOS

This skill connects Claude Code to [EverMemOS](https://docs.evermind.ai) for persistent, semantically searchable long-term memory.

## Setup

Set the `EVERMEMOS_API_KEY` environment variable:

```bash
export EVERMEMOS_API_KEY="your-api-key-here"
```

Get your API key from [console.evermind.ai/api-keys](https://console.evermind.ai/api-keys).

## Tools

### 1. Add Memories — Ingest session conversations

Extracts user and assistant text messages from Claude Code session JSONL logs and sends them to EverMemOS for memory extraction.

```bash
# Add memories from a specific session file
node scripts/add-memories.mjs --file <path-to-session.jsonl> [--user-id <id>] [--group-id <id>] [--max-turns 100] [--flush]

# Add memories from recent sessions (auto-discovers session files)
node scripts/add-memories.mjs --recent 5 [--project <pattern>] [--user-id <id>]
```

**Parameters:**

| Flag | Default | Description |
|------|---------|-------------|
| `--file` | — | Path to a specific JSONL session file |
| `--recent` | — | Process N most recent sessions (alternative to --file) |
| `--project` | — | Filter sessions by project name pattern |
| `--user-id` | `claude-user` | User ID for EverMemOS memory attribution |
| `--group-id` | auto | Group ID; defaults to session filename |
| `--max-turns` | `200` | Maximum conversation turns to process |
| `--flush` | `false` | Force immediate memory extraction on last message |
| `--dry-run` | `false` | Print messages without sending to API |

### 2. Search Memories — Semantic retrieval

Search stored memories using keyword, vector, or hybrid retrieval.

```bash
node scripts/search-memories.mjs --query "user's coding preferences" [--method hybrid] [--top-k 10] [--user-id <id>] [--types profile,episodic_memory]
```

**Parameters:**

| Flag | Default | Description |
|------|---------|-------------|
| `--query` | — | Search query text (required) |
| `--user-id` | `claude-user` | User ID to search memories for |
| `--method` | `hybrid` | Retrieval method: `keyword`, `vector`, `hybrid`, `agentic` |
| `--top-k` | `10` | Number of results to return |
| `--types` | all | Comma-separated memory types: `profile`, `episodic_memory`, `event_log`, `foresight` |
| `--group-ids` | — | Comma-separated group IDs to filter |
| `--json` | `false` | Output raw JSON response |

## How It Works

### Memory Addition Flow

1. Reads Claude Code session JSONL files (same format as `user-context/scripts/`)
2. Extracts only user text messages and assistant text responses (filters out tool calls, thinking, etc.)
3. Sends each message to EverMemOS `POST /api/v0/memories` with proper timestamps and roles
4. EverMemOS automatically extracts semantic memories (profiles, episodes, events) from the raw messages

### Memory Search Flow

1. Sends query to EverMemOS `GET /api/v0/memories/search`
2. Uses hybrid retrieval (BM25 + vector) by default for best results
3. Returns formatted results with memory type, summary, score, and timestamp

## Usage Tips

- **During evolution cycles**: Use `add-memories.mjs --recent 3` to ingest recent sessions
- **During normal work**: Use `search-memories.mjs --query "..."` to recall past context
- **Combine with user-context**: EverMemOS provides semantic search; user-context provides structured profiles — they complement each other
