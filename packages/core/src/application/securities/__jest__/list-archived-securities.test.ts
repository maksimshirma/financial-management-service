import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository";
import { listArchivedSecurities } from "../list-archived-securities";

describe("listArchivedSecurities", () => {
  it("delegates to securityRepo.listArchived", async () => {
    const securityRepo = createMockSecurityRepository();
    const securities = [buildSecurity({ is_archived: true })];
    securityRepo.listArchived.mockResolvedValue(securities);

    const result = await listArchivedSecurities({ securityRepo });

    expect(securityRepo.listArchived).toHaveBeenCalled();
    expect(result).toBe(securities);
  });
});
