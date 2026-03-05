/**
 * Shared utilities for session history search scripts.
 * All scripts use streaming JSONL processing to handle large files efficiently.
 */

import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

export const PROJECTS_DIR = join(homedir(), ".claude", "projects");

/**
 * Decode a Claude project directory name back to a readable project name.
 * e.g. "-Users-nanjiayan-Desktop-my-project" → "my-project"
 */
export function decodeProjectName(dirName) {
  const parts = dirName.split("-");
  // Take the last meaningful segment(s) as project name
  // Skip leading empty string from initial dash
  const filtered = parts.filter(Boolean);
  if (filtered.length <= 2) return filtered.join("-");
  // Return last 2 segments as project identifier
  return filtered.slice(-2).join("-");
}

/**
 * Stream-process a JSONL file line by line, calling handler for each parsed JSON object.
 */
export async function streamJsonl(filePath, handler) {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const stop = handler(obj, line.length);
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
 * Check if a message is a real user text message (not a tool_result).
 */
export function isUserTextMessage(obj) {
  return (
    obj.type === "user" &&
    obj.message?.content &&
    typeof obj.message.content === "string"
  );
}

/**
 * Extract text blocks from an assistant message, returning concatenated text.
 * Returns null if no text blocks found.
 */
export function extractAssistantText(obj) {
  if (obj.type !== "assistant") return null;
  const content = obj.message?.content;
  if (!Array.isArray(content)) return null;
  const texts = content
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text);
  return texts.length > 0 ? texts.join("\n") : null;
}

/**
 * Extract tool_use blocks from an assistant message.
 */
export function extractToolUses(obj) {
  if (obj.type !== "assistant") return [];
  const content = obj.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter((b) => b.type === "tool_use");
}

/**
 * Get a summary of a tool_use input (first meaningful field, truncated).
 */
export function summarizeToolInput(input, maxLen = 120) {
  if (!input || typeof input !== "object") return "";
  const key =
    input.command ??
    input.file_path ??
    input.pattern ??
    input.query ??
    input.url ??
    input.prompt ??
    input.content;
  if (!key) {
    const firstVal = Object.values(input)[0];
    return typeof firstVal === "string"
      ? firstVal.substring(0, maxLen)
      : "";
  }
  return String(key).substring(0, maxLen);
}

/**
 * List all project directories under ~/.claude/projects/.
 */
export async function listProjectDirs(projectFilter) {
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

/**
 * List all JSONL session files in a project directory, sorted by mtime desc.
 */
export async function listSessionFiles(projectDir) {
  const fullDir = join(PROJECTS_DIR, projectDir);
  let files;
  try {
    files = await readdir(fullDir);
  } catch {
    return [];
  }
  const jsonlFiles = files.filter(
    (f) => f.endsWith(".jsonl") && !f.includes("/")
  );
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
  return withStats
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime);
}

/**
 * Parse common CLI arguments shared across scripts.
 */
export function parseCommonArgs(extraOptions = {}) {
  const { values } = parseArgs({
    options: {
      since: { type: "string" },
      project: { type: "string" },
      limit: { type: "string" },
      file: { type: "string" },
      help: { type: "boolean", short: "h" },
      ...extraOptions,
    },
    allowPositionals: true,
    strict: false,
  });
  return values;
}
