import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";
import { listSecurities } from "../list-securities.js";

describe("listSecurities", () => {
  it("delegates to securityRepo.listByHousehold", async () => {
    const securityRepo = createMockSecurityRepository();
    const securities = [buildSecurity()];
    securityRepo.listByHousehold.mockResolvedValue(securities);

    const result = await listSecurities({ securityRepo }, "h_demo");

    expect(securityRepo.listByHousehold).toHaveBeenCalledWith("h_demo");
    expect(result).toBe(securities);
  });
});
