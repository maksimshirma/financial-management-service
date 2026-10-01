import { NotFoundError } from "../../../domain/index.js";
import { updateSecurity } from "../update-security.js";
import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";

describe("updateSecurity", () => {
  it("throws NotFoundError when the security doesn't exist", async () => {
    const securityRepo = createMockSecurityRepository();
    securityRepo.findById.mockResolvedValue(null);

    await expect(
      updateSecurity({ securityRepo }, { securityId: 999, name: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(securityRepo.update).not.toHaveBeenCalled();
  });

  it("merges only the provided mutable fields", async () => {
    const securityRepo = createMockSecurityRepository();
    const existing = buildSecurity();
    securityRepo.findById.mockResolvedValue(existing);

    await updateSecurity({ securityRepo }, { securityId: 1, name: "Sberbank PJSC" });

    expect(securityRepo.update).toHaveBeenCalledWith({ ...existing, name: "Sberbank PJSC" });
  });

  it("keeps all fields unchanged when no updates are provided", async () => {
    const securityRepo = createMockSecurityRepository();
    const existing = buildSecurity();
    securityRepo.findById.mockResolvedValue(existing);

    await updateSecurity({ securityRepo }, { securityId: 1 });

    expect(securityRepo.update).toHaveBeenCalledWith(existing);
  });
});
