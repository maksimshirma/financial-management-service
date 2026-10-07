import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";
import { listTrades } from "../list-trades.js";

describe("listTrades", () => {
  it("always scopes the filter to the household", async () => {
    const tradeRepo = createMockTradeRepository();
    const trades = [buildTrade()];
    tradeRepo.find.mockResolvedValue(trades);

    const result = await listTrades({ tradeRepo }, "h_demo", { securityId: 2 });

    expect(tradeRepo.find).toHaveBeenCalledWith({ securityId: 2, householdId: "h_demo" });
    expect(result).toBe(trades);
  });
});
