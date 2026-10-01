import { buildAccount, createMockAccountRepository } from "./mock-account-repository";
import { listAccounts } from "../list-accounts";

describe("listAccounts", () => {
  it("delegates to accountRepo.findAllByUser", async () => {
    const accountRepo = createMockAccountRepository();
    const accounts = [buildAccount()];
    accountRepo.findAllByUser.mockResolvedValue(accounts);

    const result = await listAccounts({ accountRepo }, 1);

    expect(accountRepo.findAllByUser).toHaveBeenCalledWith(1);
    expect(result).toBe(accounts);
  });
});
