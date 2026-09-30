import { AccountType, Currency, NewAccount } from "../../domain";
import { AccountRepository } from "../ports";

export interface CreateAccountInput {
  userId: NewAccount["user_id"];
  name: string;
  type: AccountType;
  currency: Currency;
}

/** @throws {DuplicateEntryError} (user_id, name) already taken */
export async function createAccount(
  deps: { accountRepo: AccountRepository },
  input: CreateAccountInput,
) {
  const account: NewAccount = {
    user_id: input.userId,
    name: input.name,
    type: input.type,
    currency: input.currency,
    is_archived: false,
  };
  return deps.accountRepo.create(account);
}
