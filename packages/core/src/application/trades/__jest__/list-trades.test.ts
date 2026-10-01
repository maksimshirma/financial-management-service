import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";
import { listTrades } from "../list-trades.js";

describe("listTrades", () => {
  it("delegates the filter to tradeRepo.find", async () => {
    const tradeRepo = createMockTradeRepository();
    const trades = [buildTrade()];
    tradeRepo.find.mockResolvedValue(trades);

    const filter = { securityId: 2 };
    const result = await listTrades({ tradeRepo }, filter);

    expect(tradeRepo.find).toHaveBeenCalledWith(filter);
    expect(result).toBe(trades);
  });
});
