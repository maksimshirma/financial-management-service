import { Currency, SecurityType } from "../../../domain/index.js";
import { createSecurity } from "../create-security.js";
import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";

describe("createSecurity", () => {
  it("creates a security private to the household and adds it to the household's list", async () => {
    const securityRepo = createMockSecurityRepository();
    const created = buildSecurity({ security_id: 7, owner_household_id: "h_demo" });
    securityRepo.create.mockResolvedValue(created);

    const result = await createSecurity(
      { securityRepo },
      {
        householdId: "h_demo",
        ticker: "AAPL",
        name: "Apple",
        type: SecurityType.STOCK,
        currency: Currency.USD,
      },
    );

    expect(securityRepo.create).toHaveBeenCalledWith({
      ticker: "AAPL",
      isin: undefined,
      name: "Apple",
      type: SecurityType.STOCK,
      currency: Currency.USD,
      face_value: undefined,
      coupon_rate: undefined,
      maturity_date: undefined,
      owner_household_id: "h_demo",
    });
    expect(securityRepo.link).toHaveBeenCalledWith("h_demo", 7);
    expect(result).toBe(created);
  });

  it("passes through bond-specific fields", async () => {
    const securityRepo = createMockSecurityRepository();
    securityRepo.create.mockResolvedValue(buildSecurity());
    const maturityDate = new Date("2041-05-15");

    await createSecurity(
      { securityRepo },
      {
        householdId: "h_demo",
        ticker: "XS123",
        isin: "XS0000000001",
        name: "Eurobond",
        type: SecurityType.BOND,
        currency: Currency.USD,
        faceValue: 1000,
        couponRate: 7.1,
        maturityDate,
      },
    );

    expect(securityRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isin: "XS0000000001",
        face_value: 1000,
        coupon_rate: 7.1,
        maturity_date: maturityDate,
      }),
    );
  });
});
