import { archiveSecurity } from "../archive-security.js";
import { createMockSecurityRepository } from "./mock-security-repository.js";

describe("archiveSecurity", () => {
  it("archives the household's link, not the security itself", async () => {
    const securityRepo = createMockSecurityRepository();

    await archiveSecurity({ securityRepo }, "h_demo", 1);

    expect(securityRepo.archiveLink).toHaveBeenCalledWith("h_demo", 1);
  });
});
