import { TransactionsTable } from "../../domain";
import { TransactionRepository } from "../ports";

/** @throws {NotFoundError} transaction does not exist */
export async function deleteTransaction(
  deps: { transactionRepo: TransactionRepository },
  transactionId: TransactionsTable["transaction_id"],
) {
  await deps.transactionRepo.delete(transactionId);
}
