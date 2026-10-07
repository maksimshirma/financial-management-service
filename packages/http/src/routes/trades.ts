import { Router } from "express";
import {
  buySecurity,
  deleteTrade,
  listTrades,
  sellSecurity,
  updateTrade,
  type AccountRepository,
  type Clock,
  type SecurityRepository,
  type TradeRepository,
} from "@fms/core";
import { ListTradesQuery, TradeBody, TradeIdParams, UpdateTradeBody } from "../dto/schemas.js";
import { requireHousehold } from "../middleware/require-household.js";
import { requireScope } from "../middleware/require-scope.js";

export function createTradesRouter(deps: {
  tradeRepo: TradeRepository;
  accountRepo: AccountRepository;
  securityRepo: SecurityRepository;
  clock: Clock;
}): Router {
  const router = Router();
  router.use(requireHousehold);

  router.post("/buy", requireScope("edit"), async (req, res) => {
    const input = TradeBody.parse(req.body);
    res.status(201).json(await buySecurity(deps, { householdId: req.auth.hid!, ...input }));
  });

  router.post("/sell", requireScope("edit"), async (req, res) => {
    const input = TradeBody.parse(req.body);
    res.status(201).json(await sellSecurity(deps, { householdId: req.auth.hid!, ...input }));
  });

  router.patch("/:tradeId", requireScope("edit"), async (req, res) => {
    const { tradeId } = TradeIdParams.parse(req.params);
    const input = UpdateTradeBody.parse(req.body);

    await updateTrade(deps, { householdId: req.auth.hid!, tradeId, ...input });
    res.status(204).end();
  });

  router.delete("/:tradeId", requireScope("edit"), async (req, res) => {
    const { tradeId } = TradeIdParams.parse(req.params);
    await deleteTrade(deps, req.auth.hid!, tradeId);
    res.status(204).end();
  });

  router.get("/", requireScope("view"), async (req, res) => {
    const filter = ListTradesQuery.parse(req.query);

    res.json(await listTrades(deps, req.auth.hid!, filter));
  });

  return router;
}
