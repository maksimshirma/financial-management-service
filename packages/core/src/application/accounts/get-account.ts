import { AccountsTable } from "../../domain";
import { AccountRepository } from "../ports";

export async function getAccount(
  deps: { accountRepo: AccountRepository },
  accountId: AccountsTable["account_id"],
) {
  return deps.accountRepo.findById(accountId);
}
