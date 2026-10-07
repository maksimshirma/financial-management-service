import { Router } from "express";
import {
  archiveAccount,
  createAccount,
  getAccount,
  listAccounts,
  listArchivedAccounts,
  updateAccount,
  type AccountRepository,
} from "@fms/core";
import { AccountIdParams, CreateAccountBody, UpdateAccountBody } from "../dto/schemas.js";
import { requireHousehold } from "../middleware/require-household.js";
import { requireScope } from "../middleware/require-scope.js";

export function createAccountsRouter(deps: { accountRepo: AccountRepository }): Router {
  const router = Router();
  router.use(requireHousehold);

  router.post("/", requireScope("edit"), async (req, res) => {
    const input = CreateAccountBody.parse(req.body);

    const account = await createAccount(deps, { householdId: req.auth.hid!, ...input });
    res.status(201).json(account);
  });

  router.patch("/:accountId", requireScope("edit"), async (req, res) => {
    const { accountId } = AccountIdParams.parse(req.params);
    const input = UpdateAccountBody.parse(req.body);

    await updateAccount(deps, { accountId, ...input });
    res.status(204).end();
  });

  router.post("/:accountId/archive", requireScope("edit"), async (req, res) => {
    const { accountId } = AccountIdParams.parse(req.params);
    await archiveAccount(deps, accountId);
    res.status(204).end();
  });

  // Must come before GET "/:accountId" — otherwise "archived" is matched as an accountId.
  router.get("/archived", requireScope("view"), async (req, res) => {
    res.json(await listArchivedAccounts(deps, req.auth.hid!));
  });

  router.get("/:accountId", requireScope("view"), async (req, res) => {
    const { accountId } = AccountIdParams.parse(req.params);
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
