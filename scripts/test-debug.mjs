// Debug: test with stdin closed
import { spawn, execSync } from "node:child_process";
import { homedir } from "node:os";

const claudePath = execSync("which claude", { encoding: "utf-8" }).trim();
console.log("Claude binary:", claudePath);

const env = { ...process.env };
delete env.CLAUDECODE;

console.log("Spawning claude (stdin=ignore)...");

const claude = spawn(claudePath, [
  "-p", "Reply with just: HELLO WORLD",
  "--output-format", "stream-json",
  "--verbose",
  "--model", "haiku",
  "--dangerously-skip-permissions",
  "--no-session-persistence",
], {
  cwd: homedir(),
  stdio: ["ignore", "pipe", "pipe"],  // KEY FIX: ignore stdin
  env,
});

claude.on("error", (err) => {
  console.error("SPAWN ERROR:", err.message);
});

let gotData = false;
claude.stdout.on("data", (data) => {
  gotData = true;
  const text = data.toString();
  console.log(`[STDOUT ${text.length} bytes]`);
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const json = JSON.parse(line);
      console.log(`  type=${json.type} subtype=${json.subtype || ""}`);
      if (json.type === "assistant" && json.message?.content) {
        for (const block of json.message.content) {
          const preview = block.text?.substring(0, 80) || block.name || "";
          console.log(`    block.type=${block.type} ${preview}`);
        }
      }
      if (json.type === "result") {
        console.log(`  result: cost=$${json.cost_usd} success=${json.subtype}`);
      }
    } catch {
      console.log(`  raw: ${line.substring(0, 120)}`);
    }
  }
});

claude.stderr.on("data", (data) => {
  console.log(`[STDERR] ${data.toString().trimEnd()}`);
});

claude.on("close", (code) => {
  console.log(`[EXIT] code=${code} gotData=${gotData}`);
});

setTimeout(() => {
  if (!gotData) {
    console.log("[TIMEOUT] No data after 30s, killing...");
    claude.kill();
  }
}, 30000);
