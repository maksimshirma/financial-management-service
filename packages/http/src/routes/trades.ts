import { Router } from "express";
import { z } from "zod";
import {
  buySecurity,
  deleteTrade,
  listTrades,
  sellSecurity,
  updateTrade,
  type Clock,
  type TradeRepository,
} from "@fms/core";
import { requireScope } from "../middleware/require-scope.js";

const tradeInputSchema = z.object({
  accountId: z.number(),
  securityId: z.number(),
  quantity: z.number(),
  price: z.number(),
  accruedInterest: z.number().optional(),
  fee: z.number().optional(),
  date: z.coerce.date().optional(),
});

export function createTradesRouter(deps: { tradeRepo: TradeRepository; clock: Clock }): Router {
  const router = Router();

  router.post("/buy", requireScope("edit"), async (req, res) => {
    const input = tradeInputSchema.parse(req.body);
    res.status(201).json(await buySecurity(deps, input));
  });

  router.post("/sell", requireScope("edit"), async (req, res) => {
    const input = tradeInputSchema.parse(req.body);
    res.status(201).json(await sellSecurity(deps, input));
  });

  router.patch("/:tradeId", requireScope("edit"), async (req, res) => {
    const tradeId = z.coerce.number().parse(req.params.tradeId);
    const input = z
      .object({
        date: z.coerce.date().optional(),
        quantity: z.number().optional(),
        price: z.number().optional(),
        accruedInterest: z.number().optional(),
        fee: z.number().optional(),
      })
      .parse(req.body);

    await updateTrade(deps, { tradeId, ...input });
    res.status(204).end();
  });

  router.delete("/:tradeId", requireScope("edit"), async (req, res) => {
    const tradeId = z.coerce.number().parse(req.params.tradeId);
    await deleteTrade(deps, tradeId);
    res.status(204).end();
  });

  router.get("/", requireScope("view"), async (req, res) => {
    const filter = z
      .object({
        accountId: z.coerce.number().optional(),
        securityId: z.coerce.number().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      })
      .parse(req.query);

    res.json(await listTrades(deps, filter));
  });

  return router;
}
