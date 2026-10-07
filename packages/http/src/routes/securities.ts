import { Router } from "express";
import {
  archiveSecurity,
  createSecurity,
  findSecurityByTicker,
  getBondSchedule,
  getSecurityQuote,
  importSecurity,
  listArchivedSecurities,
  listSecurities,
  searchSecurities,
  updateSecurity,
  type Clock,
  type MarketDataProvider,
  type SecurityRepository,
} from "@fms/core";
import {
  CreateSecurityBody,
  ImportSecurityBody,
  SearchSecuritiesQuery,
  SecurityIdParams,
  TickerParams,
  UpdateSecurityBody,
} from "../dto/schemas.js";
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
    const { q } = SearchSecuritiesQuery.parse(req.query);
    res.json(await searchSecurities(deps, q));
  });

  router.post("/import", requireScope("edit"), async (req, res) => {
    const { secid } = ImportSecurityBody.parse(req.body);
    const security = await importSecurity(deps, { householdId: req.auth.hid!, secid });
    res.status(201).json(security);
  });

  // hand-entered, private to the household — only for non-MOEX instruments
  router.post("/", requireScope("edit"), async (req, res) => {
    const input = CreateSecurityBody.parse(req.body);

    const security = await createSecurity(deps, { householdId: req.auth.hid!, ...input });
    res.status(201).json(security);
  });

  router.patch("/:securityId", requireScope("edit"), async (req, res) => {
    const { securityId } = SecurityIdParams.parse(req.params);
    const input = UpdateSecurityBody.parse(req.body);

    await updateSecurity(deps, { householdId: req.auth.hid!, securityId, ...input });
    res.status(204).end();
  });

  router.post("/:securityId/archive", requireScope("edit"), async (req, res) => {
    const { securityId } = SecurityIdParams.parse(req.params);
    await archiveSecurity(deps, req.auth.hid!, securityId);
    res.status(204).end();
  });

  router.get("/archived", requireScope("view"), async (req, res) => {
    res.json(await listArchivedSecurities(deps, req.auth.hid!));
  });

  router.get("/by-ticker/:ticker", requireScope("view"), async (req, res) => {
    const { ticker } = TickerParams.parse(req.params);
    const security = await findSecurityByTicker(deps, req.auth.hid!, ticker);
    if (!security) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(security);
  });

  router.get("/:securityId/quote", requireScope("view"), async (req, res) => {
    const { securityId } = SecurityIdParams.parse(req.params);
    res.json(await getSecurityQuote(deps, req.auth.hid!, securityId));
  });

  router.get("/:securityId/coupons", requireScope("view"), async (req, res) => {
    const { securityId } = SecurityIdParams.parse(req.params);
    res.json(await getBondSchedule(deps, req.auth.hid!, securityId));
  });

  router.get("/", requireScope("view"), async (req, res) => {
    res.json(await listSecurities(deps, req.auth.hid!));
  });

  return router;
}
