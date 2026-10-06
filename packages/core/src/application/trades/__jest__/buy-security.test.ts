import { TradeType } from "../../../domain/index.js";
import { buySecurity } from "../buy-security.js";
import {
  buildTrade,
  createMockTradeRepository,
  createTradeLookupRepos,
} from "./mock-trade-repository.js";

describe("buySecurity", () => {
  it("creates a BUY trade with accruedInterest/fee defaulted to 0", async () => {
    const tradeRepo = createMockTradeRepository();
    const created = buildTrade();
    tradeRepo.create.mockResolvedValue(created);
    const clock = { now: jest.fn() };
    const date = new Date("2026-02-01");

    const result = await buySecurity(
      { tradeRepo, ...createTradeLookupRepos(), clock },
      { accountId: 1, securityId: 2, quantity: 10, price: 50, date },
    );

    expect(tradeRepo.create).toHaveBeenCalledWith({
      date,
      account_id: 1,
      security_id: 2,
      type: TradeType.BUY,
      quantity: 10,
      price: 50,
      accrued_interest: 0,
      fee: 0,
    });
    expect(result).toBe(created);
  });

  it("passes through explicit accruedInterest/fee", async () => {
    const tradeRepo = createMockTradeRepository();
    tradeRepo.create.mockResolvedValue(buildTrade());
    const clock = { now: jest.fn() };

    await buySecurity(
      { tradeRepo, ...createTradeLookupRepos(), clock },
      { accountId: 1, securityId: 2, quantity: 10, price: 50, accruedInterest: 5, fee: 1.5 },
    );

    expect(tradeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ accrued_interest: 5, fee: 1.5 }),
    );
  });

  it("defaults the date to clock.now() when omitted", async () => {
    const tradeRepo = createMockTradeRepository();
    tradeRepo.create.mockResolvedValue(buildTrade());
    const now = new Date("2026-08-01");
    const clock = { now: jest.fn(() => now) };

    await buySecurity({ tradeRepo, ...createTradeLookupRepos(), clock }, { accountId: 1, securityId: 2, quantity: 1, price: 1 });

    expect(tradeRepo.create).toHaveBeenCalledWith(expect.objectContaining({ date: now }));
  });
});
