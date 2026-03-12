#!/usr/bin/env node
/**
 * search-memories.mjs — Search EverMemOS for stored memories.
 * Supports keyword, vector, hybrid, and agentic retrieval methods.
 *
 * Usage:
 *   node search-memories.mjs --query "coffee preference" [--method hybrid] [--top-k 10] [--user-id claude-user]
 */

import { parseArgs } from "node:util";
import https from "node:https";

// ── Config ──────────────────────────────────────────────────────────────────

const API_BASE = "https://api.evermind.ai/api/v0";

// ── CLI Args ────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    query:     { type: "string" },
    "user-id": { type: "string" },
    method:    { type: "string" },
    "top-k":   { type: "string" },
    types:     { type: "string" },
    "group-ids": { type: "string" },
    json:      { type: "boolean", default: false },
    help:      { type: "boolean", short: "h" },
  },
  allowPositionals: true,
  strict: false,
});

if (args.help || !args.query) {
  console.log(`Usage:
  node search-memories.mjs --query <text> [options]

Options:
  --user-id <id>       User ID (default: claude-user)
  --method <method>    Retrieval: keyword, vector, hybrid, agentic (default: hybrid)
  --top-k <n>          Number of results (default: 10)
  --types <list>       Comma-separated: profile, episodic_memory, event_log, foresight
  --group-ids <list>   Comma-separated group IDs to filter
  --json               Output raw JSON response`);
  process.exit(args.help ? 0 : 1);
}

const API_KEY = process.env.EVERMEMOS_API_KEY;
if (!API_KEY) {
  console.error("Error: EVERMEMOS_API_KEY environment variable is not set");
  process.exit(1);
}

const userId  = args["user-id"] ?? "claude-user";
const method  = args.method ?? "hybrid";
const topK    = args["top-k"] ? parseInt(args["top-k"], 10) : 10;
const rawJson = args.json ?? false;

// ── API Call ────────────────────────────────────────────────────────────────

/**
 * Send a GET request with a JSON body using node:https.
 * EverMemOS search API uses GET with body (non-standard), which fetch() doesn't support.
 */
function httpsRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`API error ${res.statusCode}: ${body}`));
          } else {
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error(`Invalid JSON response: ${body.slice(0, 200)}`));
            }
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function searchMemories(query) {
  const body = {
    user_id: userId,
    query,
    retrieve_method: method,
    top_k: topK,
  };

  if (args.types) {
    body.memory_types = args.types.split(",").map((t) => t.trim());
  }

  if (args["group-ids"]) {
    body.group_ids = args["group-ids"].split(",").map((g) => g.trim());
  }

  return httpsRequest(`${API_BASE}/memories/search`, body);
}

// ── Output Formatting ───────────────────────────────────────────────────────

function formatResults(data) {
  const result = data.result;
  if (!result) {
    console.log("No results returned.");
    return;
  }

  const memories = result.memories ?? [];
  const profiles = result.profiles ?? [];
  const totalCount = result.total_count ?? (memories.length + profiles.length);

  console.log(`\n=== EverMem Search Results ===`);
  console.log(`Query: "${args.query}" | Method: ${method} | Found: ${totalCount}\n`);

  if (profiles.length > 0) {
    console.log("── Profile Memories ──");
    for (const p of profiles) {
      const score = p.score ? ` (score: ${p.score.toFixed(2)})` : "";
      const type = p.item_type ?? "profile";
      console.log(`  [${type}] ${p.category ?? p.trait_name ?? "—"}: ${p.description}${score}`);
    }
    console.log();
  }

  if (memories.length > 0) {
    console.log("── Episodic / Event Memories ──");
    for (const m of memories) {
      const score = m.score ? ` (score: ${m.score.toFixed(2)})` : "";
      const time = m.timestamp ? ` @ ${m.timestamp}` : "";
      const type = m.memory_type ?? "memory";
      console.log(`  [${type}]${time}${score}`);
      console.log(`    ${m.summary ?? m.content ?? "—"}`);
    }
    console.log();
  }

  if (memories.length === 0 && profiles.length === 0) {
    console.log("  No matching memories found.");
  }

  if (result.metadata) {
    const meta = result.metadata;
    const parts = [];
    if (meta.episodic_count != null) parts.push(`episodic: ${meta.episodic_count}`);
    if (meta.profile_count != null) parts.push(`profile: ${meta.profile_count}`);
    if (meta.latency_ms != null) parts.push(`latency: ${meta.latency_ms}ms`);
    if (parts.length > 0) {
      console.log(`── Metadata: ${parts.join(", ")} ──\n`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const data = await searchMemories(args.query);

  if (rawJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    formatResults(data);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
