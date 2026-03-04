import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { homedir } from "node:os";
import { loadConfig } from "./config.js";
import { readRecentReports, cleanupReports } from "./reports.js";
import { buildPrompt } from "./prompt.js";

export type OrchestratorState = "idle" | "running";

export interface CycleResult {
  success: boolean;
  duration: number;
  output: string;
}

class Orchestrator extends EventEmitter {
  state: OrchestratorState = "idle";
  lastRun: Date | null = null;
  lastResult: CycleResult | null = null;

  async runEvolutionCycle(): Promise<CycleResult> {
    if (this.state === "running") {
      throw new Error("Evolution cycle already running");
    }

    this.state = "running";
    this.emit("cycle_start");
    const startTime = Date.now();
    let output = "";

    try {
      const config = await loadConfig();
      const recentReports = await readRecentReports(config.reportsToFeed);
      const prompt = buildPrompt(recentReports);

      const result = await new Promise<CycleResult>((resolve, reject) => {
        const claude = spawn("claude", [
          "-p", prompt,
          "--output-format", "stream-json",
          "--verbose",
          "--model", config.model,
          "--dangerously-skip-permissions",
          "--no-session-persistence",
        ], {
          cwd: homedir(),
          stdio: ["ignore", "pipe", "pipe"],
          env: (() => {
            const env = { ...process.env };
            delete env.CLAUDECODE;
            return env;
          })(),
        });

        claude.on("error", (err) => {
          if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            reject(new Error("Claude CLI not found. Please install Claude Code first."));
          } else {
            reject(err);
          }
        });

        let stderr = "";
        let buffer = "";

        claude.stdout.on("data", (data: Buffer) => {
          buffer += data.toString();
          const lines = buffer.split("\n");
          // Keep the last incomplete line in buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);

              // System init message
              if (json.type === "system" && json.subtype === "init") {
                this.emit("cycle_progress", `[init] model=${json.model} session=${json.session_id}\n`);
                continue;
              }

              // Assistant messages contain content blocks
              if (json.type === "assistant" && json.message?.content) {
                for (const block of json.message.content) {
                  if (block.type === "text" && block.text) {
                    output += block.text;
                    this.emit("cycle_progress", block.text);
                  }
                  if (block.type === "tool_use") {
                    const inputPreview = typeof block.input === "object"
                      ? (block.input.command || block.input.pattern || block.input.file_path || block.input.content?.substring(0, 80) || "").toString().substring(0, 120)
                      : "";
                    this.emit("cycle_progress", `[${block.name}] ${inputPreview}\n`);
                  }
                }
                continue;
              }

              // Tool results
              if (json.type === "tool_result") {
                this.emit("cycle_progress", `[result] ✓\n`);
                continue;
              }

              // Final result
              if (json.type === "result") {
                output = json.result ?? output;
                this.emit("cycle_progress", `\n[done] cost=$${json.cost_usd ?? "?"} duration=${json.duration_ms ?? "?"}ms\n`);
              }
            } catch {
              // non-JSON line, ignore
            }
          }
        });

        claude.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        claude.on("close", (code) => {
          const duration = Date.now() - startTime;
          if (code === 0) {
            resolve({ success: true, duration, output });
          } else {
            reject(new Error(`Claude exited with code ${code}: ${stderr}`));
          }
        });
      });

      await cleanupReports(config.maxReports);

      this.lastRun = new Date();
      this.lastResult = result;
      this.state = "idle";
      this.emit("cycle_end", result);
      return result;
    } catch (err) {
      const duration = Date.now() - startTime;
      const result: CycleResult = {
        success: false,
        duration,
        output: err instanceof Error ? err.message : String(err),
      };
      this.lastRun = new Date();
      this.lastResult = result;
      this.state = "idle";
      this.emit("cycle_error", err);
      throw err;
    }
  }
}

export const orchestrator = new Orchestrator();
