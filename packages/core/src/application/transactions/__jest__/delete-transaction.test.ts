import { NotFoundError } from "../../../domain/index.js";
import { deleteTransaction } from "../delete-transaction.js";
import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository.js";
import { createHouseholdRepos, FOREIGN, OWN } from "../../households/__jest__/household-fixtures.js";

describe("deleteTransaction", () => {
  it("deletes a transaction on the household's own account", async () => {
    const transactionRepo = createMockTransactionRepository();
    transactionRepo.findById.mockResolvedValue(buildTransaction({ account_id: OWN }));
    const { accountRepo } = createHouseholdRepos();

    await deleteTransaction({ transactionRepo, accountRepo }, "h_demo", 1);

    expect(transactionRepo.delete).toHaveBeenCalledWith(1);
  });

  it("throws NotFoundError for another household's transaction", async () => {
    const transactionRepo = createMockTransactionRepository();
    transactionRepo.findById.mockResolvedValue(buildTransaction({ account_id: FOREIGN }));
    const { accountRepo } = createHouseholdRepos();

    await expect(
      deleteTransaction({ transactionRepo, accountRepo }, "h_demo", 1),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(transactionRepo.delete).not.toHaveBeenCalled();
  });
});
