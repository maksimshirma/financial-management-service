import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getEnv } from "@fms/config";
import { Clock } from "@fms/core";
import {
  createKyselyInstance,
  KyselyAccountRepository,
  KyselyCategoryRepository,
  KyselySecurityRepository,
  KyselyTradeRepository,
  KyselyTransactionRepository,
} from "@fms/db";
import { startHttpServer } from "./http-transport.js";
import { createServer, type ServerDeps } from "./server.js";

async function main() {
  const db = createKyselyInstance({
    host: getEnv("POSTGRES_HOST") ?? "localhost",
    port: Number(getEnv("POSTGRES_PORT")),
    user: getEnv("POSTGRES_USER"),
    password: getEnv("POSTGRES_PASSWORD"),
    database: getEnv("POSTGRES_DB"),
  });

  const clock: Clock = { now: () => new Date() };

  const deps: ServerDeps = {
    accountRepo: new KyselyAccountRepository(db),
    categoryRepo: new KyselyCategoryRepository(db),
    securityRepo: new KyselySecurityRepository(db),
    transactionRepo: new KyselyTransactionRepository(db),
    tradeRepo: new KyselyTradeRepository(db),
    clock,
  };

  if ((getEnv("MCP_TRANSPORT") ?? "stdio") === "http") {
    const apiKey = getEnv("MCP_API_KEY");
    if (!apiKey) {
      throw new Error(
        "MCP_TRANSPORT=http requires MCP_API_KEY to be set — refusing to start an unauthenticated public listener.",
      );
    }
    const port = Number(getEnv("PORT") ?? "3000");
    startHttpServer(deps, { port, apiKey });
    return;
  }

  const server = createServer(deps);
  await server.connect(new StdioServerTransport());
  console.error("fms MCP server running on stdio");
}

main();
