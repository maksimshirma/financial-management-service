import { AccountsTable } from "../../domain/index.js";
import { AccountRepository } from "../ports/index.js";

export async function getAccount(
  deps: { accountRepo: AccountRepository },
  accountId: AccountsTable["account_id"],
) {
  return deps.accountRepo.findById(accountId);
}
