#!/usr/bin/env node
/**
 * extract-tool-flow.mjs — Extract tool usage sequence from a session.
 * Shows what tools were called, with brief input summaries and error detection.
 *
 * Usage:
 *   node extract-tool-flow.mjs --file <path.jsonl> [--compact]
 *
 * Output: NDJSON with {timestamp, tool, input_summary, success, error_hint?} per tool call.
 * --compact: outputs a single-line tool sequence like "Bash→Read→Edit→Bash(err)→Bash"
 */

import {
  streamJsonl,
  extractToolUses,
  summarizeToolInput,
  parseCommonArgs,
} from "./_shared.mjs";

const args = parseCommonArgs({ compact: { type: "boolean" } });

if (!args.file) {
  console.error("Usage: node extract-tool-flow.mjs --file <path.jsonl> [--compact]");
  process.exit(1);
}

const ERROR_PATTERNS = /error|Error|ENOENT|EPERM|EACCES|failed|Failed|FAIL|exception|Exception|not found|No such file|Permission denied|panic|abort|Cannot find|Module not found|SyntaxError|TypeError|ReferenceError/;

async function main() {
  // Collect tool_use entries paired with their results
  const pendingTools = new Map(); // tool_use_id → {timestamp, tool, input_summary}
  const results = [];

  await streamJsonl(args.file, (obj) => {
    if (obj.type === "assistant") {
      const toolUses = extractToolUses(obj);
      for (const tu of toolUses) {
        pendingTools.set(tu.id, {
          timestamp: obj.timestamp,
          tool: tu.name,
          input_summary: summarizeToolInput(tu.input),
        });
      }
    }

    // tool_result comes as user message with list content
    if (obj.type === "user" && Array.isArray(obj.message?.content)) {
      for (const item of obj.message.content) {
        if (item.type === "tool_result" && item.tool_use_id) {
          const pending = pendingTools.get(item.tool_use_id);
          if (pending) {
            const resultContent = extractResultText(item.content);
            const hasError = ERROR_PATTERNS.test(resultContent);
            const entry = {
              ...pending,
              success: !hasError,
            };
            if (hasError) {
              entry.error_hint = extractErrorHint(resultContent);
            }
            results.push(entry);
            pendingTools.delete(item.tool_use_id);
          }
        }
      }
    }
  });

  // Flush any pending tools without results (session ended mid-tool)
  for (const [id, pending] of pendingTools) {
    results.push({ ...pending, success: true });
  }

  if (args.compact) {
    const sequence = results.map(
      (r) => r.success ? r.tool : `${r.tool}(err)`
    );
    console.log(sequence.join("→"));
  } else {
    for (const r of results) {
      console.log(JSON.stringify(r));
    }
  }
}

function extractResultText(content) {
  if (typeof content === "string") return content.substring(0, 500);
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "string") return c;
        if (c.type === "text") return c.text ?? "";
        return "";
      })
      .join("\n")
      .substring(0, 500);
  }
  return "";
}

function extractErrorHint(text) {
  // Find the first line containing an error pattern
  const lines = text.split("\n");
  for (const line of lines) {
    if (ERROR_PATTERNS.test(line)) {
      return line.trim().substring(0, 150);
    }
  }
  return text.substring(0, 150);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
