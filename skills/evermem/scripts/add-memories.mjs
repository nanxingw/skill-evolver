#!/usr/bin/env node
/**
 * add-memories.mjs — Extract conversation messages from Claude Code session logs
 * and send them to EverMemOS for memory extraction and storage.
 *
 * Usage:
 *   node add-memories.mjs --file <path.jsonl> [--user-id claude-user] [--group-id <id>] [--max-turns 200] [--flush] [--dry-run]
 *   node add-memories.mjs --recent 5 [--project <pattern>] [--user-id claude-user]
 */

import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

// ── Config ──────────────────────────────────────────────────────────────────

const API_BASE = "https://api.evermind.ai/api/v0";
const PROJECTS_DIR = join(homedir(), ".claude", "projects");

// ── CLI Args ────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    file:       { type: "string" },
    recent:     { type: "string" },
    project:    { type: "string" },
    "user-id":  { type: "string" },
    "group-id": { type: "string" },
    "max-turns":{ type: "string" },
    flush:      { type: "boolean", default: false },
    "dry-run":  { type: "boolean", default: false },
    help:       { type: "boolean", short: "h" },
  },
  allowPositionals: true,
  strict: false,
});

if (args.help || (!args.file && !args.recent)) {
  console.log(`Usage:
  node add-memories.mjs --file <path.jsonl> [options]
  node add-memories.mjs --recent <N> [--project <pattern>] [options]

Options:
  --user-id <id>      User ID for memory attribution (default: claude-user)
  --group-id <id>     Group ID (default: session filename)
  --max-turns <n>     Max turns to process (default: 200)
  --flush             Force immediate extraction on last message
  --dry-run           Print messages without sending to API`);
  process.exit(args.help ? 0 : 1);
}

const API_KEY = process.env.EVERMEMOS_API_KEY;
if (!API_KEY && !args["dry-run"]) {
  console.error("Error: EVERMEMOS_API_KEY environment variable is not set");
  process.exit(1);
}

const userId   = args["user-id"] ?? "claude-user";
const maxTurns = args["max-turns"] ? parseInt(args["max-turns"], 10) : 200;
const dryRun   = args["dry-run"] ?? false;
const flush    = args.flush ?? false;

// ── JSONL Parsing (same approach as user-context scripts) ───────────────────

function isUserTextMessage(obj) {
  return (
    obj.type === "user" &&
    obj.message?.content &&
    typeof obj.message.content === "string"
  );
}

function extractAssistantText(obj) {
  if (obj.type !== "assistant") return null;
  const content = obj.message?.content;
  if (!Array.isArray(content)) return null;
  const texts = content
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text);
  return texts.length > 0 ? texts.join("\n") : null;
}

async function streamJsonl(filePath, handler) {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const stop = handler(obj);
      if (stop === true) {
        rl.close();
        stream.destroy();
        return;
      }
    } catch {
      // skip unparseable lines
    }
  }
}

/**
 * Extract user/assistant text messages from a session JSONL file.
 * Deduplicates streaming assistant chunks by message ID.
 */
async function extractMessages(filePath) {
  const entries = [];
  const assistantBuffer = new Map();
  let turnCount = 0;

  await streamJsonl(filePath, (obj) => {
    if (maxTurns > 0 && turnCount >= maxTurns) return true;

    if (isUserTextMessage(obj)) {
      // Flush pending assistant buffer
      for (const [, data] of assistantBuffer) {
        const combined = data.texts.join("\n");
        if (combined.trim()) {
          entries.push({ role: "assistant", timestamp: data.timestamp, text: combined });
        }
      }
      assistantBuffer.clear();

      entries.push({
        role: "user",
        timestamp: obj.timestamp,
        text: obj.message.content,
      });
      turnCount++;
    } else if (obj.type === "assistant") {
      const msgId = obj.message?.id;
      const text = extractAssistantText(obj);
      if (text && msgId) {
        if (!assistantBuffer.has(msgId)) {
          assistantBuffer.set(msgId, { timestamp: obj.timestamp, texts: [] });
        }
        assistantBuffer.get(msgId).texts.push(text);
      }
    }
  });

  // Flush remaining assistant buffer
  for (const [, data] of assistantBuffer) {
    const combined = data.texts.join("\n");
    if (combined.trim()) {
      entries.push({ role: "assistant", timestamp: data.timestamp, text: combined });
    }
  }

  return entries;
}

// ── EverMemOS API ───────────────────────────────────────────────────────────

async function addMemory(message) {
  const res = await fetch(`${API_BASE}/memories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Send extracted messages to EverMemOS.
 */
async function sendMessages(entries, groupId, groupName) {
  let sent = 0;
  let errors = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const msgId = `msg_${groupId}_${String(i).padStart(4, "0")}`;
    const createTime = entry.timestamp
      ? new Date(entry.timestamp).toISOString()
      : new Date().toISOString();

    const payload = {
      message_id: msgId,
      create_time: createTime,
      sender: entry.role === "user" ? userId : "claude-assistant",
      sender_name: entry.role === "user" ? "User" : "Claude",
      content: entry.text,
      group_id: groupId,
      group_name: groupName,
      role: entry.role,
      ...(isLast && flush ? { flush: true } : {}),
    };

    if (dryRun) {
      console.log(JSON.stringify({ dry_run: true, ...payload }));
      sent++;
      continue;
    }

    try {
      const result = await addMemory(payload);
      sent++;
      if (i % 20 === 0 || isLast) {
        process.stderr.write(`\r  Sent ${sent}/${entries.length} messages`);
      }
    } catch (err) {
      errors++;
      console.error(`\n  Error on message ${i}: ${err.message}`);
    }
  }

  process.stderr.write("\n");
  return { sent, errors };
}

// ── Session Discovery ───────────────────────────────────────────────────────

async function listProjectDirs(projectFilter) {
  let dirs;
  try {
    dirs = await readdir(PROJECTS_DIR);
  } catch {
    return [];
  }
  if (projectFilter) {
    const lower = projectFilter.toLowerCase();
    dirs = dirs.filter((d) => d.toLowerCase().includes(lower));
  }
  return dirs;
}

async function listSessionFiles(projectDir) {
  const fullDir = join(PROJECTS_DIR, projectDir);
  let files;
  try {
    files = await readdir(fullDir);
  } catch {
    return [];
  }
  const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));
  const withStats = await Promise.all(
    jsonlFiles.map(async (f) => {
      const fullPath = join(fullDir, f);
      try {
        const s = await stat(fullPath);
        return { file: f, path: fullPath, mtime: s.mtime, size: s.size };
      } catch {
        return null;
      }
    })
  );
  return withStats.filter(Boolean).sort((a, b) => b.mtime - a.mtime);
}

async function getRecentSessions(n, projectFilter) {
  const projectDirs = await listProjectDirs(projectFilter);
  const allSessions = [];

  for (const dir of projectDirs) {
    const sessions = await listSessionFiles(dir);
    for (const s of sessions) {
      allSessions.push({ ...s, project: dir });
    }
  }

  allSessions.sort((a, b) => b.mtime - a.mtime);
  return allSessions.slice(0, n);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function processFile(filePath, groupIdOverride) {
  const sessionName = basename(filePath, ".jsonl");
  const groupId = groupIdOverride ?? `session_${sessionName}`;

  console.log(`Processing: ${filePath}`);
  const entries = await extractMessages(filePath);
  console.log(`  Extracted ${entries.length} messages (${entries.filter(e => e.role === "user").length} user, ${entries.filter(e => e.role === "assistant").length} assistant)`);

  if (entries.length === 0) {
    console.log("  No messages to send, skipping.");
    return;
  }

  const { sent, errors } = await sendMessages(entries, groupId, `Claude Session ${sessionName.slice(0, 8)}`);
  console.log(`  Done: ${sent} sent, ${errors} errors`);
}

async function main() {
  if (args.file) {
    await processFile(args.file, args["group-id"]);
  } else if (args.recent) {
    const n = parseInt(args.recent, 10);
    const sessions = await getRecentSessions(n, args.project);

    if (sessions.length === 0) {
      console.error("No sessions found.");
      process.exit(1);
    }

    console.log(`Found ${sessions.length} recent sessions:\n`);
    for (const session of sessions) {
      await processFile(session.path);
    }
  }
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
