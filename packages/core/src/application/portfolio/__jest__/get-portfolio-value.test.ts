import { Currency, SecurityType, TradeType } from "../../../domain/index.js";
import { getPortfolioValue } from "../get-portfolio-value.js";
import {
  buildSecurity,
  createMockMarketDataProvider,
  createMockSecurityRepository,
} from "../../securities/__jest__/mock-security-repository.js";
import {
  buildTrade,
  createMockTradeRepository,
} from "../../trades/__jest__/mock-trade-repository.js";

const sber = buildSecurity({ security_id: 1 });
const ofz = buildSecurity({
  security_id: 2,
  ticker: "SU26238RMFS4",
  name: "ОФЗ 26238",
  type: SecurityType.BOND,
  face_value: 1000,
  board_id: "TQOB",
  market: "bonds",
});
const manual = buildSecurity({
  security_id: 3,
  ticker: "AAPL",
  name: "Apple",
  currency: Currency.USD,
  owner_household_id: "h_demo",
  board_id: undefined,
  market: undefined,
});
const at = new Date("2026-10-06T15:28:45Z");

function setup() {
  const tradeRepo = createMockTradeRepository();
  tradeRepo.find.mockResolvedValue([
    buildTrade({ security_id: 1, type: TradeType.BUY, quantity: 50 }),
    buildTrade({ security_id: 1, type: TradeType.SELL, quantity: 10 }),
    buildTrade({ security_id: 2, type: TradeType.BUY, quantity: 10 }),
    buildTrade({ security_id: 3, type: TradeType.BUY, quantity: 2 }),
  ]);
  const securityRepo = createMockSecurityRepository();
  const byId = new Map([sber, ofz, manual].map((s) => [s.security_id, s]));
  securityRepo.findById.mockImplementation(async (id) => byId.get(id) ?? null);
  const marketData = createMockMarketDataProvider();
  marketData.getQuotes.mockResolvedValue([
    { secid: "SBER", price: 282.69, priceUnit: "currency", at },
    { secid: "SU26238RMFS4", price: 50.551, priceUnit: "percent_of_face", accruedInterest: 24.51, at },
  ]);
  return { tradeRepo, securityRepo, marketData };
}

describe("getPortfolioValue", () => {
  it("values stocks at price and bonds at percent of face plus accrued interest", async () => {
    const deps = setup();

    const result = await getPortfolioValue(deps, "h_demo");

    expect(deps.tradeRepo.find).toHaveBeenCalledWith({ householdId: "h_demo" });
    // only exchange securities are sent for quotes
    expect(deps.marketData.getQuotes).toHaveBeenCalledWith([
      { secid: "SBER", boardId: "TQBR", market: "shares" },
      { secid: "SU26238RMFS4", boardId: "TQOB", market: "bonds" },
    ]);
    expect(result.positions.find((p) => p.ticker === "SBER")).toMatchObject({
      quantity: 40,
      value: 11307.6, // 40 × 282.69
    });
    expect(result.positions.find((p) => p.ticker === "SU26238RMFS4")).toMatchObject({
      quantity: 10,
      value: 5300.2, // 10 × (50.551% × 1000 + 24.51)
    });
    expect(result.totals).toEqual({ RUB: 16607.8 });
    expect(result.unpriced).toEqual(["AAPL"]);
    expect(result.quotesError).toBeUndefined();
  });

  it("reports every position as unpriced when the exchange is down", async () => {
    const deps = setup();
    deps.marketData.getQuotes.mockRejectedValue(new Error("ISS request failed"));

    const result = await getPortfolioValue(deps, "h_demo");

    expect(result.totals).toEqual({});
    expect(result.unpriced).toEqual(["SBER", "SU26238RMFS4", "AAPL"]);
    expect(result.quotesError).toBe("ISS request failed");
    expect(result.positions.map((p) => p.quantity)).toEqual([40, 10, 2]);
  });

  it("returns an empty portfolio without asking the exchange", async () => {
    const deps = setup();
    deps.tradeRepo.find.mockResolvedValue([]);

    const result = await getPortfolioValue(deps, "h_demo");

    expect(result).toEqual({ positions: [], totals: {}, unpriced: [], quotesError: undefined });
    expect(deps.marketData.getQuotes).not.toHaveBeenCalled();
  });
});
