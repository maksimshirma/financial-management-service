import express, { type Express, type Router } from "express";
import type { JWTVerifyGetKey } from "jose";
import swaggerUi from "swagger-ui-express";
import {
  type AccountRepository,
  type CategoryRepository,
  type Clock,
  type MarketDataProvider,
  type SecurityRepository,
  type TradeRepository,
  type TransactionRepository,
} from "@fms/core";
import { buildOpenApiDocument } from "./dto/openapi.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createAccountsRouter } from "./routes/accounts.js";
import { createCategoriesRouter } from "./routes/categories.js";
import { createPortfolioRouter } from "./routes/portfolio.js";
import { createSecuritiesRouter } from "./routes/securities.js";
import { createTradesRouter } from "./routes/trades.js";
import { createTransactionsRouter } from "./routes/transactions.js";

export interface ServerDeps {
  accountRepo: AccountRepository;
  categoryRepo: CategoryRepository;
  securityRepo: SecurityRepository;
  transactionRepo: TransactionRepository;
  tradeRepo: TradeRepository;
  marketData: MarketDataProvider;
  clock: Clock;
}

export interface CreateServerOptions {
  /** identity-service's signing keys — see `createJwks` in ./auth/verify-token.ts */
  jwks: JWTVerifyGetKey;
}

/** Mount prefix → router; also what the OpenAPI coverage test walks. */
export function createRouters(deps: ServerDeps): Record<string, Router> {
  return {
    "/accounts": createAccountsRouter(deps),
    "/categories": createCategoriesRouter(deps),
    "/securities": createSecuritiesRouter(deps),
    "/transactions": createTransactionsRouter(deps),
    "/trades": createTradesRouter(deps),
    "/portfolio": createPortfolioRouter(deps),
  };
}

export function createServer(deps: ServerDeps, options: CreateServerOptions): Express {
  const app = express();

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // API description is public; calls made from the UI still need a token (Authorize).
  const openApi = buildOpenApiDocument();
  app.get("/openapi.json", (_req, res) => {
    res.json(openApi);
  });
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApi, { swaggerOptions: { persistAuthorization: true } }),
  );

  app.use(express.json());
  app.use(authenticate(options.jwks));

  for (const [prefix, router] of Object.entries(createRouters(deps))) {
    app.use(prefix, router);
  }

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use(errorHandler);

  return app;
}
