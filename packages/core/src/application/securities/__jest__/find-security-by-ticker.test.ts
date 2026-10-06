import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";
import { findSecurityByTicker } from "../find-security-by-ticker.js";

describe("findSecurityByTicker", () => {
  it("looks up among securities visible to the household", async () => {
    const securityRepo = createMockSecurityRepository();
    const security = buildSecurity();
    securityRepo.findByTicker.mockResolvedValue(security);

    const result = await findSecurityByTicker({ securityRepo }, "h_demo", "SBER");

    expect(securityRepo.findByTicker).toHaveBeenCalledWith("h_demo", "SBER");
    expect(result).toBe(security);
  });

  it("returns null when not found", async () => {
    const securityRepo = createMockSecurityRepository();
    securityRepo.findByTicker.mockResolvedValue(null);

    const result = await findSecurityByTicker({ securityRepo }, "h_demo", "NOPE");

    expect(result).toBeNull();
  });
});
