import { archiveAccount } from "../archive-account.js";
import { createMockAccountRepository } from "./mock-account-repository.js";

describe("archiveAccount", () => {
  it("delegates to accountRepo.archive", async () => {
    const accountRepo = createMockAccountRepository();

    await archiveAccount({ accountRepo }, 1);

    expect(accountRepo.archive).toHaveBeenCalledWith(1);
  });
});
