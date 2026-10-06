import { Router } from "express";
import { z } from "zod";
import {
  archiveSecurity,
  createSecurity,
  Currency,
  findSecurityByTicker,
  listArchivedSecurities,
  listSecurities,
  SecurityType,
  updateSecurity,
  type SecurityRepository,
} from "@fms/core";
import { requireScope } from "../middleware/require-scope.js";

// Global reference catalog — no household scoping (a ticker is one real instrument for everyone).
export function createSecuritiesRouter(deps: { securityRepo: SecurityRepository }): Router {
  const router = Router();

  router.post("/", requireScope("edit"), async (req, res) => {
    const input = z
      .object({
        ticker: z.string(),
        isin: z.string().optional(),
        name: z.string(),
        type: z.nativeEnum(SecurityType),
        currency: z.nativeEnum(Currency),
        faceValue: z.number().optional(),
        couponRate: z.number().optional(),
        maturityDate: z.coerce.date().optional(),
      })
      .parse(req.body);

    const security = await createSecurity(deps, input);
    res.status(201).json(security);
  });

  router.patch("/:securityId", requireScope("edit"), async (req, res) => {
    const securityId = z.coerce.number().parse(req.params.securityId);
    const input = z
      .object({
        name: z.string().optional(),
        faceValue: z.number().optional(),
        couponRate: z.number().optional(),
        maturityDate: z.coerce.date().optional(),
      })
      .parse(req.body);

    await updateSecurity(deps, { securityId, ...input });
    res.status(204).end();
  });

  router.post("/:securityId/archive", requireScope("edit"), async (req, res) => {
    const securityId = z.coerce.number().parse(req.params.securityId);
    await archiveSecurity(deps, securityId);
    res.status(204).end();
  });

  router.get("/archived", requireScope("view"), async (_req, res) => {
    res.json(await listArchivedSecurities(deps));
  });

  router.get("/by-ticker/:ticker", requireScope("view"), async (req, res) => {
    const ticker = z.string().parse(req.params.ticker);
    const security = await findSecurityByTicker(deps, ticker);
    if (!security) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(security);
  });

  router.get("/", requireScope("view"), async (_req, res) => {
    res.json(await listSecurities(deps));
  });

  return router;
}
