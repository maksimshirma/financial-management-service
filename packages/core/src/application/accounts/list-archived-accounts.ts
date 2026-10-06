import { AccountsTable } from "../../domain/index.js";
import { AccountRepository } from "../ports/index.js";

export async function listArchivedAccounts(
  deps: { accountRepo: AccountRepository },
  householdId: AccountsTable["household_id"],
) {
  return deps.accountRepo.findArchivedByHousehold(householdId);
}
