import { AccountsTable } from "../../domain";
import { AccountRepository } from "../ports";

/** @throws {NotFoundError} account does not exist */
export async function archiveAccount(
  deps: { accountRepo: AccountRepository },
  accountId: AccountsTable["account_id"],
) {
  await deps.accountRepo.archive(accountId);
}
