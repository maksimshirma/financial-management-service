import { AccountType } from "../../../domain/index.js";
import {
  buildAccount,
  createMockAccountRepository,
} from "../../accounts/__jest__/mock-account-repository.js";
import {
  buildCategory,
  createMockCategoryRepository,
} from "../../categories/__jest__/mock-category-repository.js";
import {
  buildSecurity,
  createMockSecurityRepository,
} from "../../securities/__jest__/mock-security-repository.js";

/** account/category 1–2 belong to "h_demo", 9 to "h_other" */
export const OWN = 1;
export const OWN_2 = 2;
export const FOREIGN = 9;

function householdOf(id: number) {
  return id === FOREIGN ? "h_other" : "h_demo";
}

/**
 * Lookup repos wired with two households: ids OWN/OWN_2 are "h_demo"'s,
 * FOREIGN is "h_other"'s; security FOREIGN is "h_other"'s private one.
 */
export function createHouseholdRepos() {
  const accountRepo = createMockAccountRepository();
  accountRepo.findById.mockImplementation(async (id) =>
    buildAccount({ account_id: id, household_id: householdOf(id), type: AccountType.BROKER }),
  );

  const categoryRepo = createMockCategoryRepository();
  categoryRepo.findById.mockImplementation(async (id) =>
    buildCategory({ category_id: id, household_id: householdOf(id) }),
  );

  const securityRepo = createMockSecurityRepository();
  securityRepo.findVisible.mockImplementation(async (householdId, id) =>
    id === FOREIGN && householdId !== "h_other" ? null : buildSecurity({ security_id: id }),
  );

  return { accountRepo, categoryRepo, securityRepo };
}
