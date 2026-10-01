import { recordIncomeExpense } from "../record-income-expense";
import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository";

describe("recordIncomeExpense", () => {
  it("creates an income/expense transaction with transfer fields unset", async () => {
    const transactionRepo = createMockTransactionRepository();
    const created = buildTransaction();
    transactionRepo.create.mockResolvedValue(created);
    const clock = { now: jest.fn() };
    const date = new Date("2026-03-01");

    const result = await recordIncomeExpense(
      { transactionRepo, clock },
      { accountId: 1, amount: 3500, categoryId: 2, date, note: "groceries" },
    );

    expect(transactionRepo.create).toHaveBeenCalledWith({
      date,
      account_id: 1,
      amount: 3500,
      category_id: 2,
      is_transfer: false,
      to_account_id: undefined,
      to_amount: undefined,
      security_id: undefined,
      note: "groceries",
    });
    expect(result).toBe(created);
  });

  it("defaults the date to clock.now() when omitted", async () => {
    const transactionRepo = createMockTransactionRepository();
    transactionRepo.create.mockResolvedValue(buildTransaction());
    const now = new Date("2026-07-01");
    const clock = { now: jest.fn(() => now) };

    await recordIncomeExpense(
      { transactionRepo, clock },
      { accountId: 1, amount: 100, categoryId: 1 },
    );

    expect(transactionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ date: now }));
  });
});
