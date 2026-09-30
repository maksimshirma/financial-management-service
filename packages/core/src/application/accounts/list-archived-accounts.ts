import { AccountsTable } from "../../domain";
import { AccountRepository } from "../ports";

export async function listArchivedAccounts(
  deps: { accountRepo: AccountRepository },
  userId: AccountsTable["user_id"],
) {
  return deps.accountRepo.findArchivedByUser(userId);
}
