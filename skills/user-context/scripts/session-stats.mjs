#!/usr/bin/env node
/**
 * session-stats.mjs — Quick statistics for a session without reading full content.
 *
 * Usage:
 *   node session-stats.mjs --file <path.jsonl>
 *
 * Output: Single JSON object with session statistics.
 */

import {
  streamJsonl,
  isUserTextMessage,
  extractToolUses,
  parseCommonArgs,
} from "./_shared.mjs";
import { stat } from "node:fs/promises";

const args = parseCommonArgs();

if (!args.file) {
  console.error("Usage: node session-stats.mjs --file <path.jsonl>");
  process.exit(1);
}

const ERROR_PATTERNS = /error|Error|ENOENT|EPERM|EACCES|failed|Failed|FAIL|exception|Exception|not found|No such file|Permission denied/;

async function main() {
  const fileStat = await stat(args.file);

  let sessionId = null;
  let gitBranch = null;
  let cwd = null;
  let firstTimestamp = null;
  let lastTimestamp = null;
  let userMessages = 0;
  let assistantTurns = 0;
  const toolCalls = {};
  let totalToolCalls = 0;
  let errorsDetected = 0;
  const seenAssistantMsgIds = new Set();

  await streamJsonl(args.file, (obj) => {
    // Track metadata
    if (!sessionId && obj.sessionId) sessionId = obj.sessionId;
    if (!gitBranch && obj.gitBranch) gitBranch = obj.gitBranch;
    if (!cwd && obj.cwd) cwd = obj.cwd;
    if (obj.timestamp) {
      if (!firstTimestamp) firstTimestamp = obj.timestamp;
      lastTimestamp = obj.timestamp;
    }

    // Count user text messages
    if (isUserTextMessage(obj)) {
      userMessages++;
    }

    // Count assistant turns (deduplicated by message ID)
    if (obj.type === "assistant") {
      const msgId = obj.message?.id;
      if (msgId && !seenAssistantMsgIds.has(msgId)) {
        seenAssistantMsgIds.add(msgId);
        assistantTurns++;
      }

      // Count tool uses
      const tools = extractToolUses(obj);
      for (const tu of tools) {
        toolCalls[tu.name] = (toolCalls[tu.name] ?? 0) + 1;
        totalToolCalls++;
      }
    }

    // Detect errors in tool results
    if (obj.type === "user" && Array.isArray(obj.message?.content)) {
      for (const item of obj.message.content) {
        if (item.type === "tool_result") {
          const text = typeof item.content === "string"
            ? item.content
            : Array.isArray(item.content)
              ? item.content.map((c) => c.text ?? "").join("")
              : "";
          if (ERROR_PATTERNS.test(text.substring(0, 500))) {
            errorsDetected++;
          }
        }
      }
    }
  });

  // Calculate duration
  let durationMinutes = null;
  if (firstTimestamp && lastTimestamp) {
    const start = new Date(firstTimestamp);
    const end = new Date(lastTimestamp);
    durationMinutes = Math.round((end - start) / 60000);
  }

  const result = {
    session_id: sessionId,
    cwd,
    git_branch: gitBranch,
    time_range: { start: firstTimestamp, end: lastTimestamp },
    duration_minutes: durationMinutes,
    size_kb: Math.round(fileStat.size / 1024),
    user_messages: userMessages,
    assistant_turns: assistantTurns,
    tool_calls: toolCalls,
    total_tool_calls: totalToolCalls,
    errors_detected: errorsDetected,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
