import { AccountsTable, NotFoundError } from "../../domain";
import { AccountRepository } from "../ports";

export interface UpdateAccountInput {
  accountId: AccountsTable["account_id"];
  name?: string;
  type?: AccountsTable["type"];
  currency?: AccountsTable["currency"];
}

/**
 * @throws {NotFoundError} account does not exist
 * @throws {DuplicateEntryError} (user_id, name) already taken
 */
export async function updateAccount(
  deps: { accountRepo: AccountRepository },
  input: UpdateAccountInput,
) {
  const existing = await deps.accountRepo.findById(input.accountId);
  if (!existing) throw new NotFoundError("Account", input.accountId);

  await deps.accountRepo.update({
    ...existing,
    name: input.name ?? existing.name,
    type: input.type ?? existing.type,
    currency: input.currency ?? existing.currency,
  });
}
