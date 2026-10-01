import { buildAccount, createMockAccountRepository } from "./mock-account-repository";
import { listArchivedAccounts } from "../list-archived-accounts";

describe("listArchivedAccounts", () => {
  it("delegates to accountRepo.findArchivedByUser", async () => {
    const accountRepo = createMockAccountRepository();
    const accounts = [buildAccount({ is_archived: true })];
    accountRepo.findArchivedByUser.mockResolvedValue(accounts);

    const result = await listArchivedAccounts({ accountRepo }, 1);

    expect(accountRepo.findArchivedByUser).toHaveBeenCalledWith(1);
    expect(result).toBe(accounts);
  });
});
