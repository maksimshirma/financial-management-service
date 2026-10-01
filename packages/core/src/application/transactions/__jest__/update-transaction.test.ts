import { NotFoundError } from "../../../domain";
import { updateTransaction } from "../update-transaction";
import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository";

describe("updateTransaction", () => {
  it("throws NotFoundError when the transaction doesn't exist", async () => {
    const transactionRepo = createMockTransactionRepository();
    transactionRepo.findById.mockResolvedValue(null);

    await expect(
      updateTransaction({ transactionRepo }, { transactionId: 999, note: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(transactionRepo.update).not.toHaveBeenCalled();
  });

  it("merges only the provided fields", async () => {
    const transactionRepo = createMockTransactionRepository();
    const existing = buildTransaction();
    transactionRepo.findById.mockResolvedValue(existing);

    await updateTransaction({ transactionRepo }, { transactionId: 1, note: "fixed" });

    expect(transactionRepo.update).toHaveBeenCalledWith({ ...existing, note: "fixed" });
  });

  it("keeps all fields unchanged when no updates are provided", async () => {
    const transactionRepo = createMockTransactionRepository();
    const existing = buildTransaction();
    transactionRepo.findById.mockResolvedValue(existing);

    await updateTransaction({ transactionRepo }, { transactionId: 1 });

    expect(transactionRepo.update).toHaveBeenCalledWith(existing);
  });
});
