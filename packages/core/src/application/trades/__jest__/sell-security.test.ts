import { TradeType } from "../../../domain/index.js";
import { sellSecurity } from "../sell-security.js";
import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";

describe("sellSecurity", () => {
  it("creates a SELL trade with accruedInterest/fee defaulted to 0", async () => {
    const tradeRepo = createMockTradeRepository();
    const created = buildTrade({ type: TradeType.SELL });
    tradeRepo.create.mockResolvedValue(created);
    const clock = { now: jest.fn() };
    const date = new Date("2026-02-01");

    const result = await sellSecurity(
      { tradeRepo, clock },
      { accountId: 1, securityId: 2, quantity: 10, price: 50, date },
    );

    expect(tradeRepo.create).toHaveBeenCalledWith({
      date,
      account_id: 1,
      security_id: 2,
      type: TradeType.SELL,
      quantity: 10,
      price: 50,
      accrued_interest: 0,
      fee: 0,
    });
    expect(result).toBe(created);
  });

  it("defaults the date to clock.now() when omitted", async () => {
    const tradeRepo = createMockTradeRepository();
    tradeRepo.create.mockResolvedValue(buildTrade());
    const now = new Date("2026-08-01");
    const clock = { now: jest.fn(() => now) };

    await sellSecurity({ tradeRepo, clock }, { accountId: 1, securityId: 2, quantity: 1, price: 1 });

    expect(tradeRepo.create).toHaveBeenCalledWith(expect.objectContaining({ date: now }));
  });
});
