import { archiveAccount } from "../archive-account";
import { createMockAccountRepository } from "./mock-account-repository";

describe("archiveAccount", () => {
  it("delegates to accountRepo.archive", async () => {
    const accountRepo = createMockAccountRepository();

    await archiveAccount({ accountRepo }, 1);

    expect(accountRepo.archive).toHaveBeenCalledWith(1);
  });
});
