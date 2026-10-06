import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";
import { listArchivedSecurities } from "../list-archived-securities.js";

describe("listArchivedSecurities", () => {
  it("delegates to securityRepo.listArchivedByHousehold", async () => {
    const securityRepo = createMockSecurityRepository();
    const securities = [buildSecurity()];
    securityRepo.listArchivedByHousehold.mockResolvedValue(securities);

    const result = await listArchivedSecurities({ securityRepo }, "h_demo");

    expect(securityRepo.listArchivedByHousehold).toHaveBeenCalledWith("h_demo");
    expect(result).toBe(securities);
  });
});
