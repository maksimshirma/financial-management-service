import { NotFoundError, TradeType } from "../../../domain/index.js";
import { buySecurity } from "../buy-security.js";
import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";
import { createHouseholdRepos, FOREIGN, OWN } from "../../households/__jest__/household-fixtures.js";

function setup(now = new Date("2026-08-01")) {
  const tradeRepo = createMockTradeRepository();
  tradeRepo.create.mockResolvedValue(buildTrade());
  const clock = { now: jest.fn(() => now) };
  return { tradeRepo, ...createHouseholdRepos(), clock };
}

describe("buySecurity", () => {
  it("creates a BUY trade with accruedInterest/fee defaulted to 0", async () => {
    const deps = setup();
    const date = new Date("2026-02-01");

    await buySecurity(deps, {
      householdId: "h_demo",
      accountId: OWN,
      securityId: 2,
      quantity: 10,
      price: 50,
      date,
    });

    expect(deps.tradeRepo.create).toHaveBeenCalledWith({
      date,
      account_id: OWN,
      security_id: 2,
      type: TradeType.BUY,
      quantity: 10,
      price: 50,
      accrued_interest: 0,
      fee: 0,
    });
  });

  it("passes through explicit accruedInterest/fee", async () => {
    const deps = setup();

    await buySecurity(deps, {
      householdId: "h_demo",
      accountId: OWN,
      securityId: 2,
      quantity: 10,
      price: 50,
      accruedInterest: 5,
      fee: 1.5,
    });

    expect(deps.tradeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ accrued_interest: 5, fee: 1.5 }),
    );
  });

  it("defaults the date to clock.now() when omitted", async () => {
    const now = new Date("2026-08-01");
    const deps = setup(now);

    await buySecurity(deps, { householdId: "h_demo", accountId: OWN, securityId: 2, quantity: 1, price: 1 });

    expect(deps.tradeRepo.create).toHaveBeenCalledWith(expect.objectContaining({ date: now }));
  });

  it("refuses another household's account", async () => {
    const deps = setup();

    await expect(
      buySecurity(deps, { householdId: "h_demo", accountId: FOREIGN, securityId: 2, quantity: 1, price: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.tradeRepo.create).not.toHaveBeenCalled();
  });
});
