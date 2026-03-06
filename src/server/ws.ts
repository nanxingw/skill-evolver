import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { executor } from "../executor.js";

export interface WsBroadcast {
  broadcast: (event: string, data: unknown) => void;
}

export function setupWebSocket(server: Server): WsBroadcast {
  const wss = new WebSocketServer({ server, path: "/ws" });

  function broadcast(event: string, data: unknown): void {
    const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  wss.on("connection", (ws) => {
    const status = {
      event: "status",
      data: {
        state: executor.state,
        lastRun: executor.lastRun?.toISOString() ?? null,
      },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(status));
  });

  return { broadcast };
}
