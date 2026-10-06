import { Currency, NotFoundError, SecurityType } from "../../../domain/index.js";
import { importSecurity } from "../import-security.js";
import {
  buildSecurity,
  createMockMarketDataProvider,
  createMockSecurityRepository,
} from "./mock-security-repository.js";

describe("importSecurity", () => {
  const now = new Date("2026-10-06T12:00:00Z");
  const clock = { now: () => now };

  it("upserts the exchange spec into the shared reference and links it to the household", async () => {
    const securityRepo = createMockSecurityRepository();
    const marketData = createMockMarketDataProvider();
    marketData.getSpec.mockResolvedValue({
      secid: "SU26238RMFS4",
      isin: "RU000A1038V6",
      name: "ОФЗ 26238",
      type: SecurityType.BOND,
      currency: Currency.RUB,
      boardId: "TQOB",
      market: "bonds",
      faceValue: 1000,
      couponRate: 7.1,
      maturityDate: new Date("2041-05-15"),
    });
    const saved = buildSecurity({ security_id: 3, ticker: "SU26238RMFS4" });
    securityRepo.upsertExchange.mockResolvedValue(saved);

    const result = await importSecurity(
      { securityRepo, marketData, clock },
      { householdId: "h_demo", secid: "SU26238RMFS4" },
    );

    expect(securityRepo.upsertExchange).toHaveBeenCalledWith({
      ticker: "SU26238RMFS4",
      isin: "RU000A1038V6",
      name: "ОФЗ 26238",
      type: SecurityType.BOND,
      currency: Currency.RUB,
      face_value: 1000,
      coupon_rate: 7.1,
      maturity_date: new Date("2041-05-15"),
      board_id: "TQOB",
      market: "bonds",
      synced_at: now,
    });
    expect(securityRepo.link).toHaveBeenCalledWith("h_demo", 3);
    expect(result).toBe(saved);
  });

  it("throws NotFoundError when the exchange doesn't know the code", async () => {
    const securityRepo = createMockSecurityRepository();
    const marketData = createMockMarketDataProvider();
    marketData.getSpec.mockResolvedValue(null);

    await expect(
      importSecurity({ securityRepo, marketData, clock }, { householdId: "h_demo", secid: "NOPE" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(securityRepo.upsertExchange).not.toHaveBeenCalled();
    expect(securityRepo.link).not.toHaveBeenCalled();
  });
});
