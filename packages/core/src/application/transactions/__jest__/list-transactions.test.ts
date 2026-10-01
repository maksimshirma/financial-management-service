import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository.js";
import { listTransactions } from "../list-transactions.js";

describe("listTransactions", () => {
  it("delegates the filter to transactionRepo.find", async () => {
    const transactionRepo = createMockTransactionRepository();
    const transactions = [buildTransaction()];
    transactionRepo.find.mockResolvedValue(transactions);

    const filter = { accountId: 1, from: new Date("2026-01-01") };
    const result = await listTransactions({ transactionRepo }, filter);

    expect(transactionRepo.find).toHaveBeenCalledWith(filter);
    expect(result).toBe(transactions);
  });
});
