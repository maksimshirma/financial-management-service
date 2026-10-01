import { NotFoundError } from "../../../domain";
import { updateAccount } from "../update-account";
import { buildAccount, createMockAccountRepository } from "./mock-account-repository";

describe("updateAccount", () => {
  it("throws NotFoundError when the account doesn't exist", async () => {
    const accountRepo = createMockAccountRepository();
    accountRepo.findById.mockResolvedValue(null);

    await expect(
      updateAccount({ accountRepo }, { accountId: 999, name: "New" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(accountRepo.update).not.toHaveBeenCalled();
  });

  it("merges only the provided fields, keeping the rest unchanged", async () => {
    const accountRepo = createMockAccountRepository();
    const existing = buildAccount();
    accountRepo.findById.mockResolvedValue(existing);

    await updateAccount({ accountRepo }, { accountId: 1, name: "Renamed" });

    expect(accountRepo.update).toHaveBeenCalledWith({ ...existing, name: "Renamed" });
  });

  it("keeps all fields unchanged when no updates are provided", async () => {
    const accountRepo = createMockAccountRepository();
    const existing = buildAccount();
    accountRepo.findById.mockResolvedValue(existing);

    await updateAccount({ accountRepo }, { accountId: 1 });

    expect(accountRepo.update).toHaveBeenCalledWith(existing);
  });
});
