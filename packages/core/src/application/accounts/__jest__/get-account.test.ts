import { buildAccount, createMockAccountRepository } from "./mock-account-repository.js";
import { getAccount } from "../get-account.js";

describe("getAccount", () => {
  it("returns the account when found", async () => {
    const accountRepo = createMockAccountRepository();
    const account = buildAccount();
    accountRepo.findById.mockResolvedValue(account);

    const result = await getAccount({ accountRepo }, 1);

    expect(accountRepo.findById).toHaveBeenCalledWith(1);
    expect(result).toBe(account);
  });

  it("returns null when not found", async () => {
    const accountRepo = createMockAccountRepository();
    accountRepo.findById.mockResolvedValue(null);

    const result = await getAccount({ accountRepo }, 999);

    expect(result).toBeNull();
  });
});
