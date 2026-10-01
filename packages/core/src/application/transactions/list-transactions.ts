import { TransactionFilter, TransactionRepository } from "../ports/index.js";

export async function listTransactions(
  deps: { transactionRepo: TransactionRepository },
  filter: TransactionFilter,
) {
  return deps.transactionRepo.find(filter);
}
