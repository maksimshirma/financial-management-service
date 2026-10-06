import { AccountsTable } from "../../domain/index.js";
import { TransactionFilter, TransactionRepository } from "../ports/index.js";

/** Only transactions on the household's own accounts, whatever else the filter says. */
export async function listTransactions(
  deps: { transactionRepo: TransactionRepository },
  householdId: AccountsTable["household_id"],
  filter: Omit<TransactionFilter, "householdId"> = {},
) {
  return deps.transactionRepo.find({ ...filter, householdId });
}
