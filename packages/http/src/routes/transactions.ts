import { Router } from "express";
import { z } from "zod";
import {
  deleteTransaction,
  listTransactions,
  recordIncomeExpense,
  transferBetweenAccounts,
  updateTransaction,
  type Clock,
  type TransactionRepository,
} from "@fms/core";
import { requireScope } from "../middleware/require-scope.js";

export function createTransactionsRouter(
  deps: { transactionRepo: TransactionRepository; clock: Clock },
): Router {
  const router = Router();

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

    const transaction = await recordIncomeExpense(deps, input);
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

    const transaction = await transferBetweenAccounts(deps, input);
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

    await updateTransaction(deps, { transactionId, ...input });
    res.status(204).end();
  });

  router.delete("/:transactionId", requireScope("edit"), async (req, res) => {
    const transactionId = z.coerce.number().parse(req.params.transactionId);
    await deleteTransaction(deps, transactionId);
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

    res.json(await listTransactions(deps, filter));
  });

  return router;
}
