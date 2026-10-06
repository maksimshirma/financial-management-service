import { Router } from "express";
import { z } from "zod";
import {
  AccountType,
  archiveAccount,
  createAccount,
  Currency,
  getAccount,
  listAccounts,
  listArchivedAccounts,
  updateAccount,
  type AccountRepository,
} from "@fms/core";
import { requireHousehold } from "../middleware/require-household.js";
import { requireScope } from "../middleware/require-scope.js";

export function createAccountsRouter(deps: { accountRepo: AccountRepository }): Router {
  const router = Router();
  router.use(requireHousehold);

  router.post("/", requireScope("edit"), async (req, res) => {
    const input = z
      .object({
        name: z.string(),
        type: z.nativeEnum(AccountType),
        currency: z.nativeEnum(Currency),
      })
      .parse(req.body);

    const account = await createAccount(deps, { householdId: req.auth.hid!, ...input });
    res.status(201).json(account);
  });

  router.patch("/:accountId", requireScope("edit"), async (req, res) => {
    const accountId = z.coerce.number().parse(req.params.accountId);
    const input = z
      .object({
        name: z.string().optional(),
        type: z.nativeEnum(AccountType).optional(),
        currency: z.nativeEnum(Currency).optional(),
      })
      .parse(req.body);

    await updateAccount(deps, { accountId, ...input });
    res.status(204).end();
  });

  router.post("/:accountId/archive", requireScope("edit"), async (req, res) => {
    const accountId = z.coerce.number().parse(req.params.accountId);
    await archiveAccount(deps, accountId);
    res.status(204).end();
  });

  // Must come before GET "/:accountId" — otherwise "archived" is matched as an accountId.
  router.get("/archived", requireScope("view"), async (req, res) => {
    res.json(await listArchivedAccounts(deps, req.auth.hid!));
  });

  router.get("/:accountId", requireScope("view"), async (req, res) => {
    const accountId = z.coerce.number().parse(req.params.accountId);
    const account = await getAccount(deps, accountId);
    if (!account) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(account);
  });

  router.get("/", requireScope("view"), async (req, res) => {
    res.json(await listAccounts(deps, req.auth.hid!));
  });

  return router;
}
