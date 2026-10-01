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
import { createServer } from "./server";

async function main() {
  const db = createKyselyInstance({
    host: getEnv("POSTGRES_HOST") ?? "localhost",
    port: Number(getEnv("POSTGRES_PORT")),
    user: getEnv("POSTGRES_USER"),
    password: getEnv("POSTGRES_PASSWORD"),
    database: getEnv("POSTGRES_DB"),
  });

  const clock: Clock = { now: () => new Date() };

  const server = createServer({
    accountRepo: new KyselyAccountRepository(db),
    categoryRepo: new KyselyCategoryRepository(db),
    securityRepo: new KyselySecurityRepository(db),
    transactionRepo: new KyselyTransactionRepository(db),
    tradeRepo: new KyselyTradeRepository(db),
    clock,
  });

  await server.connect(new StdioServerTransport());
  console.error("fms MCP server running on stdio");
}

main();
