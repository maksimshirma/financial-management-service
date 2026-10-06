import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository.js";
import { listTransactions } from "../list-transactions.js";

describe("listTransactions", () => {
  it("always scopes the filter to the household", async () => {
    const transactionRepo = createMockTransactionRepository();
    const transactions = [buildTransaction()];
    transactionRepo.find.mockResolvedValue(transactions);

    const from = new Date("2026-01-01");
    const result = await listTransactions({ transactionRepo }, "h_demo", { accountId: 1, from });

    expect(transactionRepo.find).toHaveBeenCalledWith({ accountId: 1, from, householdId: "h_demo" });
    expect(result).toBe(transactions);
  });
});
