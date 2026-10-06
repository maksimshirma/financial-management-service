import { InvalidTransactionError, NotFoundError } from "../../../domain/index.js";
import { transferBetweenAccounts } from "../transfer-between-accounts.js";
import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository.js";
import { createHouseholdRepos, FOREIGN, OWN, OWN_2 } from "../../households/__jest__/household-fixtures.js";

function setup(now = new Date("2026-06-15")) {
  const transactionRepo = createMockTransactionRepository();
  transactionRepo.create.mockResolvedValue(buildTransaction());
  const { accountRepo } = createHouseholdRepos();
  const clock = { now: jest.fn(() => now) };
  return { transactionRepo, accountRepo, clock };
}

describe("transferBetweenAccounts", () => {
  it("throws InvalidTransactionError when transferring to the same account", async () => {
    const deps = setup();

    await expect(
      transferBetweenAccounts(deps, { householdId: "h_demo", accountId: OWN, toAccountId: OWN, amount: 100 }),
    ).rejects.toBeInstanceOf(InvalidTransactionError);
    expect(deps.transactionRepo.create).not.toHaveBeenCalled();
  });

  it("creates a transfer transaction with category_id/security_id unset", async () => {
    const deps = setup();
    const date = new Date("2026-05-01");

    await transferBetweenAccounts(deps, {
      householdId: "h_demo",
      accountId: OWN,
      toAccountId: OWN_2,
      amount: 500,
      toAmount: 500,
      date,
      note: "top-up",
    });

    expect(deps.transactionRepo.create).toHaveBeenCalledWith({
      date,
      account_id: OWN,
      amount: 500,
      category_id: undefined,
      is_transfer: true,
      to_account_id: OWN_2,
      to_amount: 500,
      security_id: undefined,
      note: "top-up",
    });
  });

  it("defaults the date to clock.now() when omitted", async () => {
    const now = new Date("2026-06-15");
    const deps = setup(now);

    await transferBetweenAccounts(deps, { householdId: "h_demo", accountId: OWN, toAccountId: OWN_2, amount: 100 });

    expect(deps.transactionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ date: now }));
  });

  it.each([
    ["source", { accountId: FOREIGN, toAccountId: OWN }],
    ["destination", { accountId: OWN, toAccountId: FOREIGN }],
  ])("refuses another household's %s account", async (_, ids) => {
    const deps = setup();

    await expect(
      transferBetweenAccounts(deps, { householdId: "h_demo", amount: 100, ...ids }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.transactionRepo.create).not.toHaveBeenCalled();
  });
});
