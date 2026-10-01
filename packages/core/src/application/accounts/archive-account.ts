import { AccountsTable } from "../../domain/index.js";
import { AccountRepository } from "../ports/index.js";

/** @throws {NotFoundError} account does not exist */
export async function archiveAccount(
  deps: { accountRepo: AccountRepository },
  accountId: AccountsTable["account_id"],
) {
  await deps.accountRepo.archive(accountId);
}
