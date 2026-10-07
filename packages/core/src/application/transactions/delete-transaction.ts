import { AccountsTable, TransactionsTable } from "../../domain/index.js";
import { AccountRepository, TransactionRepository } from "../ports/index.js";
import { requireOwnTransaction } from "./require-own-transaction.js";

/** @throws {NotFoundError} transaction does not exist or is on another household's account */
export async function deleteTransaction(
  deps: { transactionRepo: TransactionRepository; accountRepo: AccountRepository },
  householdId: AccountsTable["household_id"],
  transactionId: TransactionsTable["transaction_id"],
) {
  await requireOwnTransaction(deps, householdId, transactionId);
  await deps.transactionRepo.delete(transactionId);
}
