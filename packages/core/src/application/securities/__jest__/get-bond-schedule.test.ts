import { ForbiddenError, NotFoundError, SecurityType } from "../../../domain/index.js";
import { getBondSchedule } from "../get-bond-schedule.js";
import {
  buildSecurity,
  createMockMarketDataProvider,
  createMockSecurityRepository,
} from "./mock-security-repository.js";

const ofz = buildSecurity({
  security_id: 3,
  ticker: "SU26238RMFS4",
  type: SecurityType.BOND,
  board_id: "TQOB",
  market: "bonds",
});

function setup() {
  const securityRepo = createMockSecurityRepository();
  const marketData = createMockMarketDataProvider();
  const clock = { now: () => new Date("2026-12-02T10:00:00Z") };
  return { securityRepo, marketData, clock };
}

describe("getBondSchedule", () => {
  it("returns coupons from today on", async () => {
    const deps = setup();
    deps.securityRepo.findVisible.mockResolvedValue(ofz);
    deps.marketData.getCouponSchedule.mockResolvedValue([
      { date: new Date("2026-06-03"), amount: 35.4, rate: 7.1 },
      { date: new Date("2026-12-02"), amount: 35.4, rate: 7.1 },
      { date: new Date("2027-06-02"), amount: 35.4, rate: 7.1 },
    ]);

    const result = await getBondSchedule(deps, "h_demo", 3);

    expect(deps.marketData.getCouponSchedule).toHaveBeenCalledWith("SU26238RMFS4");
    expect(result.map((c) => c.date)).toEqual([new Date("2026-12-02"), new Date("2027-06-02")]);
  });

  it("throws NotFoundError for a security the household can't see", async () => {
    const deps = setup();
    deps.securityRepo.findVisible.mockResolvedValue(null);

    await expect(getBondSchedule(deps, "h_demo", 3)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError for a stock", async () => {
    const deps = setup();
    deps.securityRepo.findVisible.mockResolvedValue(buildSecurity());

    await expect(getBondSchedule(deps, "h_demo", 1)).rejects.toBeInstanceOf(ForbiddenError);
    expect(deps.marketData.getCouponSchedule).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError for a hand-entered bond", async () => {
    const deps = setup();
    deps.securityRepo.findVisible.mockResolvedValue(
      { ...ofz, owner_household_id: "h_demo", board_id: undefined, market: undefined },
    );

    await expect(getBondSchedule(deps, "h_demo", 3)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
