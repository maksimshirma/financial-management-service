import { NotFoundError } from "../../../domain/index.js";
import { recordIncomeExpense } from "../record-income-expense.js";
import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository.js";
import { createHouseholdRepos, FOREIGN, OWN, OWN_2 } from "../../households/__jest__/household-fixtures.js";

function setup(now = new Date("2026-07-01")) {
  const transactionRepo = createMockTransactionRepository();
  transactionRepo.create.mockResolvedValue(buildTransaction());
  const { accountRepo, categoryRepo } = createHouseholdRepos();
  const clock = { now: jest.fn(() => now) };
  return { transactionRepo, accountRepo, categoryRepo, clock };
}

describe("recordIncomeExpense", () => {
  it("creates an income/expense transaction with transfer fields unset", async () => {
    const deps = setup();
    const date = new Date("2026-03-01");

    await recordIncomeExpense(deps, {
      householdId: "h_demo",
      accountId: OWN,
      amount: 3500,
      categoryId: OWN_2,
      date,
      note: "groceries",
    });

    expect(deps.transactionRepo.create).toHaveBeenCalledWith({
      date,
      account_id: OWN,
      amount: 3500,
      category_id: OWN_2,
      is_transfer: false,
      to_account_id: undefined,
      to_amount: undefined,
      security_id: undefined,
      note: "groceries",
    });
  });

  it("defaults the date to clock.now() when omitted", async () => {
    const now = new Date("2026-07-01");
    const deps = setup(now);

    await recordIncomeExpense(deps, { householdId: "h_demo", accountId: OWN, amount: 100, categoryId: OWN });

    expect(deps.transactionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ date: now }));
  });

  it.each([
    ["account", { accountId: FOREIGN, categoryId: OWN }],
    ["category", { accountId: OWN, categoryId: FOREIGN }],
  ])("refuses another household's %s", async (_, ids) => {
    const deps = setup();

    await expect(
      recordIncomeExpense(deps, { householdId: "h_demo", amount: 100, ...ids }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.transactionRepo.create).not.toHaveBeenCalled();
  });
});
