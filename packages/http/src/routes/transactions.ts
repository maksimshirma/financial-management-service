import { Router } from "express";
import { z } from "zod";
import {
  deleteTransaction,
  listTransactions,
  recordIncomeExpense,
  transferBetweenAccounts,
  updateTransaction,
  type AccountRepository,
  type CategoryRepository,
  type Clock,
  type SecurityRepository,
  type TransactionRepository,
} from "@fms/core";
import { requireHousehold } from "../middleware/require-household.js";
import { requireScope } from "../middleware/require-scope.js";

export function createTransactionsRouter(deps: {
  transactionRepo: TransactionRepository;
  accountRepo: AccountRepository;
  categoryRepo: CategoryRepository;
  securityRepo: SecurityRepository;
  clock: Clock;
}): Router {
  const router = Router();
  router.use(requireHousehold);

  router.post("/", requireScope("edit"), async (req, res) => {
    const input = z
      .object({
        accountId: z.number(),
        amount: z.number(),
        categoryId: z.number(),
        date: z.coerce.date().optional(),
        note: z.string().optional(),
      })
      .parse(req.body);

    const transaction = await recordIncomeExpense(deps, { householdId: req.auth.hid!, ...input });
    res.status(201).json(transaction);
  });

  router.post("/transfer", requireScope("edit"), async (req, res) => {
    const input = z
      .object({
        accountId: z.number(),
        toAccountId: z.number(),
        amount: z.number(),
        toAmount: z.number().optional(),
        date: z.coerce.date().optional(),
        note: z.string().optional(),
      })
      .parse(req.body);

    const transaction = await transferBetweenAccounts(deps, {
      householdId: req.auth.hid!,
      ...input,
    });
    res.status(201).json(transaction);
  });

  router.patch("/:transactionId", requireScope("edit"), async (req, res) => {
    const transactionId = z.coerce.number().parse(req.params.transactionId);
    const input = z
      .object({
        date: z.coerce.date().optional(),
        amount: z.number().optional(),
        categoryId: z.number().optional(),
        toAccountId: z.number().optional(),
        toAmount: z.number().optional(),
        securityId: z.number().optional(),
        note: z.string().optional(),
      })
      .parse(req.body);

    await updateTransaction(deps, { householdId: req.auth.hid!, transactionId, ...input });
    res.status(204).end();
  });

  router.delete("/:transactionId", requireScope("edit"), async (req, res) => {
    const transactionId = z.coerce.number().parse(req.params.transactionId);
    await deleteTransaction(deps, req.auth.hid!, transactionId);
    res.status(204).end();
  });

  router.get("/", requireScope("view"), async (req, res) => {
    const filter = z
      .object({
        accountId: z.coerce.number().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      })
      .parse(req.query);

    res.json(await listTransactions(deps, req.auth.hid!, filter));
  });

  return router;
}
