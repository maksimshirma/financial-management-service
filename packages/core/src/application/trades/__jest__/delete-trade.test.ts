import { deleteTrade } from "../delete-trade.js";
import { createMockTradeRepository } from "./mock-trade-repository.js";

describe("deleteTrade", () => {
  it("delegates to tradeRepo.delete", async () => {
    const tradeRepo = createMockTradeRepository();

    await deleteTrade({ tradeRepo }, 1);

    expect(tradeRepo.delete).toHaveBeenCalledWith(1);
  });
});
