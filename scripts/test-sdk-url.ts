#!/usr/bin/env npx tsx
/**
 * Proof-of-concept: Test whether `claude --sdk-url` is supported.
 *
 * 1. Starts a local WebSocket server on a random port
 * 2. Spawns claude with --sdk-url pointing back to us
 * 3. Waits for CLI to connect, receives system.init, sends a test message
 * 4. SUCCESS if CLI connects and responds; FALLBACK if CLI exits quickly
 * 5. 30s timeout safety
 */

import { WebSocketServer, WebSocket } from "ws";
import { spawn } from "node:child_process";
import { createServer } from "node:http";

const TIMEOUT_MS = 30_000;

async function main() {
  // 1. Create HTTP + WS server on random port
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer });

  let cliConnected = false;
  let gotInit = false;
  let gotResponse = false;
  let cliSocket: WebSocket | null = null;

  wss.on("connection", (ws) => {
    cliConnected = true;
    cliSocket = ws;
    console.log("[server] CLI connected via WebSocket");

    // Buffer for incomplete lines (NDJSON)
    let buffer = "";

    ws.on("message", (raw) => {
      buffer += raw.toString();
      const lines = buffer.split("\n");
      // Keep last incomplete line in buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          console.log("[server] Received:", JSON.stringify(msg).slice(0, 200));

          if (msg.type === "system" && msg.subtype === "init") {
            gotInit = true;
            console.log("[server] Got system.init — session:", msg.session_id);
            // Send a test user message
            const userMsg = JSON.stringify({
              type: "user",
              content: { type: "text", text: "Say exactly: HELLO_SDK" },
            }) + "\n";
            ws.send(userMsg);
            console.log("[server] Sent test user message");
          }

          if (msg.type === "assistant" && msg.content) {
            const text = typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content)
                ? msg.content.map((b: { text?: string }) => b.text ?? "").join("")
                : "";
            if (text.includes("HELLO_SDK")) {
              gotResponse = true;
              console.log("[server] Got expected response from CLI");
            }
          }

          // result message indicates turn is complete
          if (msg.type === "result") {
            gotResponse = true;
            console.log("[server] Got result message — turn complete");
          }
        } catch (e) {
          // Not valid JSON yet, skip
        }
      }
    });

    ws.on("close", () => {
      console.log("[server] CLI WebSocket closed");
    });
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = httpServer.address() as { port: number };
  const port = addr.port;
  const sdkUrl = `ws://127.0.0.1:${port}/ws/cli/test`;
  console.log(`[server] Listening on port ${port}`);
  console.log(`[server] SDK URL: ${sdkUrl}`);

  // 2. Spawn claude CLI
  console.log("[spawn] Starting claude with --sdk-url...");
  const cliProc = spawn("claude", [
    "--sdk-url", sdkUrl,
    "--print",
    "--output-format", "stream-json",
    "--input-format", "stream-json",
    "-p", "",
  ], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      CLAUDECODE: undefined,  // Prevent agent-context detection
    },
  });

  let cliStdout = "";
  let cliStderr = "";
  let cliExited = false;
  let cliExitCode: number | null = null;

  cliProc.stdout?.on("data", (d) => {
    cliStdout += d.toString();
  });
  cliProc.stderr?.on("data", (d) => {
    cliStderr += d.toString();
  });

  const cliExitPromise = new Promise<number | null>((resolve) => {
    cliProc.on("exit", (code) => {
      cliExited = true;
      cliExitCode = code;
      resolve(code);
    });
  });

  // 3. Wait with timeout
  const timeout = setTimeout(() => {
    console.log("\n[timeout] 30s reached — killing CLI");
    cliProc.kill("SIGTERM");
  }, TIMEOUT_MS);

  // Wait for CLI to either connect or exit quickly
  const quickExitTimeout = 5_000;
  const quickExit = await Promise.race([
    cliExitPromise.then(() => "exited" as const),
    new Promise<"waiting">((resolve) => setTimeout(() => resolve("waiting"), quickExitTimeout)),
  ]);

  if (quickExit === "exited" && !cliConnected) {
    clearTimeout(timeout);
    console.log("\n========================================");
    console.log("FALLBACK: CLI exited quickly without connecting.");
    console.log(`Exit code: ${cliExitCode}`);
    if (cliStderr) console.log("stderr:", cliStderr.slice(0, 500));
    if (cliStdout) console.log("stdout:", cliStdout.slice(0, 500));
    console.log("--sdk-url is likely not supported in this CLI version.");
    console.log("========================================");
    cleanup();
    process.exit(1);
  }

  // If still running, wait for response or exit
  if (!cliExited) {
    // Wait for either a response or exit
    await Promise.race([
      cliExitPromise,
      new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (gotResponse) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      }),
    ]);
  }

  clearTimeout(timeout);

  // 4. Report results
  console.log("\n========================================");
  if (cliConnected && gotInit && gotResponse) {
    console.log("SUCCESS: --sdk-url is fully functional!");
    console.log("  - CLI connected via WebSocket");
    console.log("  - Received system.init");
    console.log("  - Got response to test message");
  } else if (cliConnected && gotInit) {
    console.log("PARTIAL SUCCESS: CLI connected and initialized but no response captured.");
    console.log("  --sdk-url works for connection, message handling may need tweaking.");
  } else if (cliConnected) {
    console.log("PARTIAL: CLI connected but did not send system.init.");
  } else {
    console.log("FALLBACK: CLI did not connect via WebSocket.");
    if (cliStderr) console.log("stderr:", cliStderr.slice(0, 500));
  }
  console.log("========================================");

  // Cleanup
  cliProc.kill("SIGTERM");
  cleanup();

  function cleanup() {
    try { cliSocket?.close(); } catch { /* ignore */ }
    wss.close();
    httpServer.close();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
