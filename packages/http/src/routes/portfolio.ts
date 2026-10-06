import { Router } from "express";
import {
  getPortfolioValue,
  type MarketDataProvider,
  type SecurityRepository,
  type TradeRepository,
} from "@fms/core";
import { requireHousehold } from "../middleware/require-household.js";
import { requireScope } from "../middleware/require-scope.js";

export function createPortfolioRouter(deps: {
  tradeRepo: TradeRepository;
  securityRepo: SecurityRepository;
  marketData: MarketDataProvider;
}): Router {
  const router = Router();
  router.use(requireHousehold);

  router.get("/value", requireScope("view"), async (req, res) => {
    res.json(await getPortfolioValue(deps, req.auth.hid!));
  });

  return router;
}
