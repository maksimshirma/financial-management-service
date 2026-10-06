import { NotFoundError } from "../../../domain/index.js";
import { updateTrade } from "../update-trade.js";
import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";
import { createHouseholdRepos, FOREIGN, OWN } from "../../households/__jest__/household-fixtures.js";

function setup(existing = buildTrade({ account_id: OWN })) {
  const tradeRepo = createMockTradeRepository();
  tradeRepo.findById.mockResolvedValue(existing);
  const { accountRepo } = createHouseholdRepos();
  return { tradeRepo, accountRepo, existing };
}

describe("updateTrade", () => {
  it("throws NotFoundError when the trade doesn't exist", async () => {
    const deps = setup();
    deps.tradeRepo.findById.mockResolvedValue(null);

    await expect(
      updateTrade(deps, { householdId: "h_demo", tradeId: 999, quantity: 5 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.tradeRepo.update).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a trade on another household's account", async () => {
    const deps = setup(buildTrade({ account_id: FOREIGN }));

    await expect(
      updateTrade(deps, { householdId: "h_demo", tradeId: 1, quantity: 5 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.tradeRepo.update).not.toHaveBeenCalled();
  });

  it("merges only the provided fields", async () => {
    const deps = setup();

    await updateTrade(deps, { householdId: "h_demo", tradeId: 1, quantity: 20 });

    expect(deps.tradeRepo.update).toHaveBeenCalledWith({ ...deps.existing, quantity: 20 });
  });

  it("keeps all fields unchanged when no updates are provided", async () => {
    const deps = setup();

    await updateTrade(deps, { householdId: "h_demo", tradeId: 1 });

    expect(deps.tradeRepo.update).toHaveBeenCalledWith(deps.existing);
  });
});
