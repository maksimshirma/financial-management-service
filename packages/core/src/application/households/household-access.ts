import {
  AccountsTable,
  CategoriesTable,
  NotFoundError,
  SecuritiesTable,
} from "../../domain/index.js";
import { AccountRepository, CategoryRepository, SecurityRepository } from "../ports/index.js";

// Ownership checks shared by use-cases that act on a household's data by id.
// Something that belongs to another household is reported as not found, so
// callers can't probe which ids exist elsewhere.

type HouseholdId = AccountsTable["household_id"];

/** @throws {NotFoundError} account does not exist or belongs to another household */
export async function requireOwnAccount(
  accountRepo: AccountRepository,
  householdId: HouseholdId,
  accountId: AccountsTable["account_id"],
): Promise<AccountsTable> {
  const account = await accountRepo.findById(accountId);
  if (!account || account.household_id !== householdId) {
    throw new NotFoundError("Account", accountId);
  }
  return account;
}

/** @throws {NotFoundError} category does not exist or belongs to another household */
export async function requireOwnCategory(
  categoryRepo: CategoryRepository,
  householdId: HouseholdId,
  categoryId: CategoriesTable["category_id"],
): Promise<CategoriesTable> {
  const category = await categoryRepo.findById(categoryId);
  if (!category || category.household_id !== householdId) {
    throw new NotFoundError("Category", categoryId);
  }
  return category;
}

/** @throws {NotFoundError} security does not exist or is another household's private one */
export async function requireVisibleSecurity(
  securityRepo: SecurityRepository,
  householdId: HouseholdId,
  securityId: SecuritiesTable["security_id"],
): Promise<SecuritiesTable> {
  const security = await securityRepo.findVisible(householdId, securityId);
  if (!security) throw new NotFoundError("Security", securityId);
  return security;
}
