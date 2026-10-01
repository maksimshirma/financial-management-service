import { deleteTransaction } from "../delete-transaction";
import { createMockTransactionRepository } from "./mock-transaction-repository";

describe("deleteTransaction", () => {
  it("delegates to transactionRepo.delete", async () => {
    const transactionRepo = createMockTransactionRepository();

    await deleteTransaction({ transactionRepo }, 1);

    expect(transactionRepo.delete).toHaveBeenCalledWith(1);
  });
});
