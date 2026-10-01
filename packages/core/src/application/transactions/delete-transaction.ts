import { TransactionsTable } from "../../domain/index.js";
import { TransactionRepository } from "../ports/index.js";

/** @throws {NotFoundError} transaction does not exist */
export async function deleteTransaction(
  deps: { transactionRepo: TransactionRepository },
  transactionId: TransactionsTable["transaction_id"],
) {
  await deps.transactionRepo.delete(transactionId);
}
