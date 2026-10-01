import { archiveSecurity } from "../archive-security.js";
import { createMockSecurityRepository } from "./mock-security-repository.js";

describe("archiveSecurity", () => {
  it("delegates to securityRepo.archive", async () => {
    const securityRepo = createMockSecurityRepository();

    await archiveSecurity({ securityRepo }, 1);

    expect(securityRepo.archive).toHaveBeenCalledWith(1);
  });
});
