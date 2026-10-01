import { AccountsTable } from "../../domain/index.js";
import { AccountRepository } from "../ports/index.js";

export async function listArchivedAccounts(
  deps: { accountRepo: AccountRepository },
  userId: AccountsTable["user_id"],
) {
  return deps.accountRepo.findArchivedByUser(userId);
}
