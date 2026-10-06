import { buildAccount, createMockAccountRepository } from "./mock-account-repository.js";
import { listAccounts } from "../list-accounts.js";

describe("listAccounts", () => {
  it("delegates to accountRepo.findAllByHousehold", async () => {
    const accountRepo = createMockAccountRepository();
    const accounts = [buildAccount()];
    accountRepo.findAllByHousehold.mockResolvedValue(accounts);

    const result = await listAccounts({ accountRepo }, "h_demo");

    expect(accountRepo.findAllByHousehold).toHaveBeenCalledWith("h_demo");
    expect(result).toBe(accounts);
  });
});
