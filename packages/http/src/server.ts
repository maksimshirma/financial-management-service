import express, { type Express } from "express";
import type { JWTVerifyGetKey } from "jose";
import {
  type AccountRepository,
  type CategoryRepository,
  type Clock,
  type MarketDataProvider,
  type SecurityRepository,
  type TradeRepository,
  type TransactionRepository,
} from "@fms/core";
import { createJwks } from "./auth/verify-token.js";
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
  identityServiceUrl: string;
}

export function createServer(deps: ServerDeps, options: CreateServerOptions): Express {
  const app = express();
  const jwks: JWTVerifyGetKey = createJwks(options.identityServiceUrl);

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(express.json());
  app.use(authenticate(jwks));

  app.use("/accounts", createAccountsRouter(deps));
  app.use("/categories", createCategoriesRouter(deps));
  app.use("/securities", createSecuritiesRouter(deps));
  app.use("/transactions", createTransactionsRouter(deps));
  app.use("/trades", createTradesRouter(deps));
  app.use("/portfolio", createPortfolioRouter(deps));

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use(errorHandler);

  return app;
}
