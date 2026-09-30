import { AccountsTable } from "../../domain";
import { AccountRepository } from "../ports";

export async function listAccounts(
  deps: { accountRepo: AccountRepository },
  userId: AccountsTable["user_id"],
) {
  return deps.accountRepo.findAllByUser(userId);
}
