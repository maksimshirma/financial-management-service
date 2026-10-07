import { NotFoundError } from "../../../domain/index.js";
import { deleteTrade } from "../delete-trade.js";
import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";
import { createHouseholdRepos, FOREIGN, OWN } from "../../households/__jest__/household-fixtures.js";

describe("deleteTrade", () => {
  it("deletes a trade on the household's own account", async () => {
    const tradeRepo = createMockTradeRepository();
    tradeRepo.findById.mockResolvedValue(buildTrade({ account_id: OWN }));
    const { accountRepo } = createHouseholdRepos();

    await deleteTrade({ tradeRepo, accountRepo }, "h_demo", 1);

    expect(tradeRepo.delete).toHaveBeenCalledWith(1);
  });

  it("throws NotFoundError for another household's trade", async () => {
    const tradeRepo = createMockTradeRepository();
    tradeRepo.findById.mockResolvedValue(buildTrade({ account_id: FOREIGN }));
    const { accountRepo } = createHouseholdRepos();

    await expect(deleteTrade({ tradeRepo, accountRepo }, "h_demo", 1)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(tradeRepo.delete).not.toHaveBeenCalled();
  });
});
