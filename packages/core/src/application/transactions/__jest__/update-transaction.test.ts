import { NotFoundError } from "../../../domain/index.js";
import { updateTransaction } from "../update-transaction.js";
import { buildTransaction, createMockTransactionRepository } from "./mock-transaction-repository.js";
import { createHouseholdRepos, FOREIGN, OWN, OWN_2 } from "../../households/__jest__/household-fixtures.js";

function setup(existing = buildTransaction({ account_id: OWN })) {
  const transactionRepo = createMockTransactionRepository();
  transactionRepo.findById.mockResolvedValue(existing);
  return { transactionRepo, ...createHouseholdRepos(), existing };
}

describe("updateTransaction", () => {
  it("throws NotFoundError when the transaction doesn't exist", async () => {
    const deps = setup();
    deps.transactionRepo.findById.mockResolvedValue(null);

    await expect(
      updateTransaction(deps, { householdId: "h_demo", transactionId: 999, note: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.transactionRepo.update).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a transaction on another household's account", async () => {
    const deps = setup(buildTransaction({ account_id: FOREIGN }));

    await expect(
      updateTransaction(deps, { householdId: "h_demo", transactionId: 1, note: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.transactionRepo.update).not.toHaveBeenCalled();
  });

  it.each([
    ["category", { categoryId: FOREIGN }],
    ["to-account", { toAccountId: FOREIGN }],
    ["private security", { securityId: FOREIGN }],
  ])("refuses to point at another household's %s", async (_, change) => {
    const deps = setup();

    await expect(
      updateTransaction(deps, { householdId: "h_demo", transactionId: 1, ...change }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.transactionRepo.update).not.toHaveBeenCalled();
  });

  it("merges only the provided fields", async () => {
    const deps = setup();

    await updateTransaction(deps, {
      householdId: "h_demo",
      transactionId: 1,
      note: "fixed",
      categoryId: OWN_2,
      securityId: 3,
    });

    expect(deps.transactionRepo.update).toHaveBeenCalledWith({
      ...deps.existing,
      note: "fixed",
      category_id: OWN_2,
      security_id: 3,
    });
  });

  it("keeps all fields unchanged when no updates are provided", async () => {
    const deps = setup();

    await updateTransaction(deps, { householdId: "h_demo", transactionId: 1 });

    expect(deps.transactionRepo.update).toHaveBeenCalledWith(deps.existing);
  });
});
