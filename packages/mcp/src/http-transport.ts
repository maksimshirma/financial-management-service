import express, { type NextFunction, type Request, type Response } from "express";
import type { Server } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, type ServerDeps } from "./server.js";

export interface HttpServerOptions {
  port: number;
  apiKey: string;
}

/**
 * Streamable HTTP transport — lets any MCP-compatible agent add this server
 * by URL instead of spawning/piping a local process. Stateless: this server
 * never sends server-initiated notifications, so a fresh McpServer + fresh
 * transport is created per request rather than tracking sessions (the SDK
 * itself throws if a stateless transport is reused across requests).
 */
export function startHttpServer(deps: ServerDeps, options: HttpServerOptions): Server {
  const { port, apiKey } = options;
  const app = express();

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(authenticate(apiKey));

  app.post("/mcp", async (req, res) => {
    const server = createServer(deps);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    // No parsed body passed in — the SDK reads/parses the request stream
    // itself (incl. its own size guard); nothing upstream must consume it.
    await transport.handleRequest(req, res);
  });

  app.get("/mcp", (_req, res) => {
    res.status(405).json({ error: "method_not_allowed" });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("fms MCP http-transport: unhandled error", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal_error" });
    }
  });

  return app.listen(port, () => {
    console.error(`fms MCP server listening on :${port} (streamable HTTP, stateless, auth required)`);
  });
}

function authenticate(apiKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    // Plain string equality — a deliberate tradeoff for a single-tenant
    // personal server with one shared secret, not multi-tenant access
    // control. Revisit if this ever serves more than one trusted caller.
    if (!header?.startsWith("Bearer ") || header.slice("Bearer ".length) !== apiKey) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  };
}
