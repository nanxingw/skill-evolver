import type { Server, IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { Duplex } from "node:stream";
import { executor } from "../executor.js";

export interface WsBroadcast {
  broadcast: (event: string, data: unknown) => void;
}

export interface LegacyWss {
  wss: WebSocketServer;
  broadcast: (event: string, data: unknown) => void;
  /** Handle an upgrade request for the legacy /ws path. */
  handleUpgrade: (req: IncomingMessage, socket: Duplex, head: Buffer) => void;
}

/**
 * Set up the legacy dashboard WebSocket using noServer mode.
 * The caller is responsible for routing upgrade requests to handleUpgrade().
 */
export function setupWebSocket(_server: Server): LegacyWss {
  const wss = new WebSocketServer({ noServer: true });

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

  function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  }

  return { wss, broadcast, handleUpgrade };
}
