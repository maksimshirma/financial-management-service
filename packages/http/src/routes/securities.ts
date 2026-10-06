import { Router } from "express";
import { z } from "zod";
import {
  archiveSecurity,
  createSecurity,
  Currency,
  findSecurityByTicker,
  getBondSchedule,
  getSecurityQuote,
  importSecurity,
  listArchivedSecurities,
  listSecurities,
  searchSecurities,
  SecurityType,
  updateSecurity,
  type Clock,
  type MarketDataProvider,
  type SecurityRepository,
} from "@fms/core";
import { requireHousehold } from "../middleware/require-household.js";
import { requireScope } from "../middleware/require-scope.js";

// Securities are a shared reference (exchange ones are common to everyone),
// but what a household sees, archives or hand-enters is scoped to it.
export function createSecuritiesRouter(deps: {
  securityRepo: SecurityRepository;
  marketData: MarketDataProvider;
  clock: Clock;
}): Router {
  const router = Router();
  router.use(requireHousehold);

  // exchange search — doesn't touch the household's list
  router.get("/search", requireScope("view"), async (req, res) => {
    const { q } = z.object({ q: z.string().min(2) }).parse(req.query);
    res.json(await searchSecurities(deps, q));
  });

  router.post("/import", requireScope("edit"), async (req, res) => {
    const { secid } = z.object({ secid: z.string() }).parse(req.body);
    const security = await importSecurity(deps, { householdId: req.auth.hid!, secid });
    res.status(201).json(security);
  });

  // hand-entered, private to the household — only for non-MOEX instruments
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

    const security = await createSecurity(deps, { householdId: req.auth.hid!, ...input });
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

    await updateSecurity(deps, { householdId: req.auth.hid!, securityId, ...input });
    res.status(204).end();
  });

  router.post("/:securityId/archive", requireScope("edit"), async (req, res) => {
    const securityId = z.coerce.number().parse(req.params.securityId);
    await archiveSecurity(deps, req.auth.hid!, securityId);
    res.status(204).end();
  });

  router.get("/archived", requireScope("view"), async (req, res) => {
    res.json(await listArchivedSecurities(deps, req.auth.hid!));
  });

  router.get("/by-ticker/:ticker", requireScope("view"), async (req, res) => {
    const ticker = z.string().parse(req.params.ticker);
    const security = await findSecurityByTicker(deps, req.auth.hid!, ticker);
    if (!security) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(security);
  });

  router.get("/:securityId/quote", requireScope("view"), async (req, res) => {
    const securityId = z.coerce.number().parse(req.params.securityId);
    res.json(await getSecurityQuote(deps, req.auth.hid!, securityId));
  });

  router.get("/:securityId/coupons", requireScope("view"), async (req, res) => {
    const securityId = z.coerce.number().parse(req.params.securityId);
    res.json(await getBondSchedule(deps, req.auth.hid!, securityId));
  });

  router.get("/", requireScope("view"), async (req, res) => {
    res.json(await listSecurities(deps, req.auth.hid!));
  });

  return router;
}
