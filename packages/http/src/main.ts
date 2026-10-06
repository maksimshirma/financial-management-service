import { getEnv } from "@fms/config";
import { type Clock } from "@fms/core";
import {
  createKyselyInstance,
  KyselyAccountRepository,
  KyselyCategoryRepository,
  KyselySecurityRepository,
  KyselyTradeRepository,
  KyselyTransactionRepository,
} from "@fms/db";
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

  const identityServiceUrl = getEnv("IDENTITY_SERVICE_URL");
  if (!identityServiceUrl) {
    throw new Error(
      "IDENTITY_SERVICE_URL must be set — the HTTP adapter verifies internal-JWTs against identity-service's JWKS.",
    );
  }

  const app = createServer(deps, { identityServiceUrl });
  const port = Number(getEnv("PORT") ?? "3000");
  app.listen(port, () => {
    console.error(`fms HTTP server listening on :${port}`);
  });
}

main();
