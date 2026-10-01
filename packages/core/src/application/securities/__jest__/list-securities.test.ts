import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository";
import { listSecurities } from "../list-securities";

describe("listSecurities", () => {
  it("delegates to securityRepo.listAll", async () => {
    const securityRepo = createMockSecurityRepository();
    const securities = [buildSecurity()];
    securityRepo.listAll.mockResolvedValue(securities);

    const result = await listSecurities({ securityRepo });

    expect(securityRepo.listAll).toHaveBeenCalled();
    expect(result).toBe(securities);
  });
});
