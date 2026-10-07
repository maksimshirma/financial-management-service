import { AccountsTable, NotFoundError, TransactionsTable } from "../../domain/index.js";
import { AccountRepository, TransactionRepository } from "../ports/index.js";

/** @throws {NotFoundError} transaction does not exist or is on another household's account */
export async function requireOwnTransaction(
  deps: { transactionRepo: TransactionRepository; accountRepo: AccountRepository },
  householdId: AccountsTable["household_id"],
  transactionId: TransactionsTable["transaction_id"],
): Promise<TransactionsTable> {
  const transaction = await deps.transactionRepo.findById(transactionId);
  const account = transaction && (await deps.accountRepo.findById(transaction.account_id));
  if (!transaction || !account || account.household_id !== householdId) {
    throw new NotFoundError("Transaction", transactionId);
  }
  return transaction;
}
