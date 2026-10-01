import { Currency, SecurityType } from "../../../domain/index.js";
import { createSecurity } from "../create-security.js";
import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";

describe("createSecurity", () => {
  it("builds a new security with is_archived defaulted to false", async () => {
    const securityRepo = createMockSecurityRepository();
    const created = buildSecurity();
    securityRepo.create.mockResolvedValue(created);

    const result = await createSecurity(
      { securityRepo },
      { ticker: "SBER", name: "Sberbank", type: SecurityType.STOCK, currency: Currency.RUB },
    );

    expect(securityRepo.create).toHaveBeenCalledWith({
      ticker: "SBER",
      isin: undefined,
      name: "Sberbank",
      type: SecurityType.STOCK,
      currency: Currency.RUB,
      face_value: undefined,
      coupon_rate: undefined,
      maturity_date: undefined,
      is_archived: false,
    });
    expect(result).toBe(created);
  });

  it("passes through bond-specific fields", async () => {
    const securityRepo = createMockSecurityRepository();
    securityRepo.create.mockResolvedValue(buildSecurity());
    const maturityDate = new Date("2041-05-15");

    await createSecurity(
      { securityRepo },
      {
        ticker: "SU26238",
        isin: "RU000A1038V6",
        name: "OFZ 26238",
        type: SecurityType.BOND,
        currency: Currency.RUB,
        faceValue: 1000,
        couponRate: 7.1,
        maturityDate,
      },
    );

    expect(securityRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isin: "RU000A1038V6",
        face_value: 1000,
        coupon_rate: 7.1,
        maturity_date: maturityDate,
      }),
    );
  });
});
