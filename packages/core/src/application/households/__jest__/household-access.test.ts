import { NotFoundError } from "../../../domain/index.js";
import {
  requireOwnAccount,
  requireOwnCategory,
  requireVisibleSecurity,
} from "../household-access.js";
import { createHouseholdRepos, FOREIGN, OWN } from "./household-fixtures.js";

describe("household access", () => {
  it("returns the household's own account/category and a visible security", async () => {
    const { accountRepo, categoryRepo, securityRepo } = createHouseholdRepos();

    await expect(requireOwnAccount(accountRepo, "h_demo", OWN)).resolves.toMatchObject({ account_id: OWN });
    await expect(requireOwnCategory(categoryRepo, "h_demo", OWN)).resolves.toMatchObject({ category_id: OWN });
    await expect(requireVisibleSecurity(securityRepo, "h_demo", OWN)).resolves.toMatchObject({ security_id: OWN });
  });

  it("reports another household's data as not found", async () => {
    const { accountRepo, categoryRepo, securityRepo } = createHouseholdRepos();

    await expect(requireOwnAccount(accountRepo, "h_demo", FOREIGN)).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireOwnCategory(categoryRepo, "h_demo", FOREIGN)).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireVisibleSecurity(securityRepo, "h_demo", FOREIGN)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("reports a missing account as not found", async () => {
    const { accountRepo } = createHouseholdRepos();
    accountRepo.findById.mockResolvedValue(null);

    await expect(requireOwnAccount(accountRepo, "h_demo", OWN)).rejects.toBeInstanceOf(NotFoundError);
  });
});
