import { InvalidTransactionError } from "../../../domain/index.js";
import { transferBetweenAccounts } from "../transfer-between-accounts.js";
import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository.js";

describe("transferBetweenAccounts", () => {
  it("throws InvalidTransactionError when transferring to the same account", async () => {
    const transactionRepo = createMockTransactionRepository();
    const clock = { now: jest.fn() };

    await expect(
      transferBetweenAccounts(
        { transactionRepo, clock },
        { accountId: 1, toAccountId: 1, amount: 100 },
      ),
    ).rejects.toBeInstanceOf(InvalidTransactionError);
    expect(transactionRepo.create).not.toHaveBeenCalled();
  });

  it("creates a transfer transaction with category_id/security_id unset", async () => {
    const transactionRepo = createMockTransactionRepository();
    const created = buildTransaction({ is_transfer: true, to_account_id: 2 });
    transactionRepo.create.mockResolvedValue(created);
    const clock = { now: jest.fn() };
    const date = new Date("2026-05-01");

    const result = await transferBetweenAccounts(
      { transactionRepo, clock },
      { accountId: 1, toAccountId: 2, amount: 500, toAmount: 500, date, note: "top-up" },
    );

    expect(transactionRepo.create).toHaveBeenCalledWith({
      date,
      account_id: 1,
      amount: 500,
      category_id: undefined,
      is_transfer: true,
      to_account_id: 2,
      to_amount: 500,
      security_id: undefined,
      note: "top-up",
    });
    expect(result).toBe(created);
  });

  it("defaults the date to clock.now() when omitted", async () => {
    const transactionRepo = createMockTransactionRepository();
    transactionRepo.create.mockResolvedValue(buildTransaction());
    const now = new Date("2026-06-15");
    const clock = { now: jest.fn(() => now) };

    await transferBetweenAccounts(
      { transactionRepo, clock },
      { accountId: 1, toAccountId: 2, amount: 100 },
    );

    expect(transactionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ date: now }));
  });
});
