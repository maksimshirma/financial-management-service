import { AccountType, Currency, NewAccount } from "../../domain/index.js";
import { AccountRepository } from "../ports/index.js";

export interface CreateAccountInput {
  householdId: NewAccount["household_id"];
  name: string;
  type: AccountType;
  currency: Currency;
}

/** @throws {DuplicateEntryError} (household_id, name) already taken */
export async function createAccount(
  deps: { accountRepo: AccountRepository },
  input: CreateAccountInput,
) {
  const account: NewAccount = {
    household_id: input.householdId,
    name: input.name,
    type: input.type,
    currency: input.currency,
    is_archived: false,
  };
  return deps.accountRepo.create(account);
}
