import { SecurityType } from "../../../domain/index.js";
import { searchSecurities } from "../search-securities.js";
import { createMockMarketDataProvider } from "./mock-security-repository.js";

describe("searchSecurities", () => {
  it("searches the exchange", async () => {
    const marketData = createMockMarketDataProvider();
    const candidates = [{ secid: "SBER", name: "Сбербанк", type: SecurityType.STOCK }];
    marketData.search.mockResolvedValue(candidates);

    const result = await searchSecurities({ marketData }, "сбер");

    expect(marketData.search).toHaveBeenCalledWith("сбер");
    expect(result).toBe(candidates);
  });
});
