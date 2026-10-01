import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";
import { findSecurityByTicker } from "../find-security-by-ticker.js";

describe("findSecurityByTicker", () => {
  it("returns the security when found", async () => {
    const securityRepo = createMockSecurityRepository();
    const security = buildSecurity();
    securityRepo.findByTicker.mockResolvedValue(security);

    const result = await findSecurityByTicker({ securityRepo }, "SBER");

    expect(securityRepo.findByTicker).toHaveBeenCalledWith("SBER");
    expect(result).toBe(security);
  });

  it("returns null when not found", async () => {
    const securityRepo = createMockSecurityRepository();
    securityRepo.findByTicker.mockResolvedValue(null);

    const result = await findSecurityByTicker({ securityRepo }, "NOPE");

    expect(result).toBeNull();
  });
});
