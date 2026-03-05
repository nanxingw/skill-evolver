#!/usr/bin/env node
/**
 * session-digest.mjs — Extract conversation essence from a session.
 * Outputs only user text messages and assistant text responses.
 * Filters out tool_results, progress, thinking, file-history-snapshots.
 *
 * Usage:
 *   node session-digest.mjs --file <path.jsonl> [--max-turns 50]
 *
 * Output: NDJSON with {role, timestamp, text} per line.
 */

import {
  streamJsonl,
  isUserTextMessage,
  extractAssistantText,
  parseCommonArgs,
} from "./_shared.mjs";

const args = parseCommonArgs({ "max-turns": { type: "string" } });

if (!args.file) {
  console.error("Usage: node session-digest.mjs --file <path.jsonl> [--max-turns 50]");
  process.exit(1);
}

const maxTurns = args["max-turns"] ? parseInt(args["max-turns"], 10) : 0;

async function main() {
  let turnCount = 0;
  // Track seen assistant message IDs to deduplicate streaming chunks
  const seenAssistantIds = new Set();

  // Buffer assistant text blocks by message ID (they come in multiple JSONL lines)
  const assistantBuffer = new Map();

  // First pass: collect all text, then output in order
  const entries = [];

  await streamJsonl(args.file, (obj) => {
    if (maxTurns > 0 && turnCount >= maxTurns) return true;

    if (isUserTextMessage(obj)) {
      // Flush any pending assistant buffer before this user message
      flushAssistantBuffer(assistantBuffer, entries);
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
          assistantBuffer.set(msgId, {
            timestamp: obj.timestamp,
            texts: [],
          });
        }
        assistantBuffer.get(msgId).texts.push(text);
      }
    }
  });

  // Flush remaining assistant buffer
  flushAssistantBuffer(assistantBuffer, entries);

  for (const entry of entries) {
    console.log(JSON.stringify(entry));
  }
}

function flushAssistantBuffer(buffer, entries) {
  for (const [msgId, data] of buffer) {
    const combined = data.texts.join("\n");
    if (combined.trim()) {
      entries.push({
        role: "assistant",
        timestamp: data.timestamp,
        text: combined,
      });
    }
  }
  buffer.clear();
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
