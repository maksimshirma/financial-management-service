import { buildAccount, createMockAccountRepository } from "./mock-account-repository.js";
import { listArchivedAccounts } from "../list-archived-accounts.js";

describe("listArchivedAccounts", () => {
  it("delegates to accountRepo.findArchivedByHousehold", async () => {
    const accountRepo = createMockAccountRepository();
    const accounts = [buildAccount({ is_archived: true })];
    accountRepo.findArchivedByHousehold.mockResolvedValue(accounts);

    const result = await listArchivedAccounts({ accountRepo }, "h_demo");

    expect(accountRepo.findArchivedByHousehold).toHaveBeenCalledWith("h_demo");
    expect(result).toBe(accounts);
  });
});
