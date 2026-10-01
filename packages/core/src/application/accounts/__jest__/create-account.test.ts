import { AccountType, Currency } from "../../../domain";
import { createAccount } from "../create-account";
import { buildAccount, createMockAccountRepository } from "./mock-account-repository";

describe("createAccount", () => {
  it("builds a new account with is_archived defaulted to false", async () => {
    const accountRepo = createMockAccountRepository();
    const created = buildAccount();
    accountRepo.create.mockResolvedValue(created);

    const result = await createAccount(
      { accountRepo },
      { userId: 1, name: "Cash", type: AccountType.CASH, currency: Currency.RUB },
    );

    expect(accountRepo.create).toHaveBeenCalledWith({
      user_id: 1,
      name: "Cash",
      type: AccountType.CASH,
      currency: Currency.RUB,
      is_archived: false,
    });
    expect(result).toBe(created);
  });
});
