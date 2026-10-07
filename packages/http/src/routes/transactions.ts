import { Router } from "express";
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
import {
  ListTransactionsQuery,
  RecordIncomeExpenseBody,
  TransactionIdParams,
  TransferBody,
  UpdateTransactionBody,
} from "../dto/schemas.js";
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
    const input = RecordIncomeExpenseBody.parse(req.body);

    const transaction = await recordIncomeExpense(deps, { householdId: req.auth.hid!, ...input });
    res.status(201).json(transaction);
  });

  router.post("/transfer", requireScope("edit"), async (req, res) => {
    const input = TransferBody.parse(req.body);

    const transaction = await transferBetweenAccounts(deps, {
      householdId: req.auth.hid!,
      ...input,
    });
    res.status(201).json(transaction);
  });

  router.patch("/:transactionId", requireScope("edit"), async (req, res) => {
    const { transactionId } = TransactionIdParams.parse(req.params);
    const input = UpdateTransactionBody.parse(req.body);

    await updateTransaction(deps, { householdId: req.auth.hid!, transactionId, ...input });
    res.status(204).end();
  });

  router.delete("/:transactionId", requireScope("edit"), async (req, res) => {
    const { transactionId } = TransactionIdParams.parse(req.params);
    await deleteTransaction(deps, req.auth.hid!, transactionId);
    res.status(204).end();
  });

  router.get("/", requireScope("view"), async (req, res) => {
    const filter = ListTransactionsQuery.parse(req.query);

    res.json(await listTransactions(deps, req.auth.hid!, filter));
  });

  return router;
}
