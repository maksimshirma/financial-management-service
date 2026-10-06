import { ForbiddenError, NotFoundError } from "../../../domain/index.js";
import { updateSecurity } from "../update-security.js";
import { buildSecurity, createMockSecurityRepository } from "./mock-security-repository.js";

describe("updateSecurity", () => {
  it("throws NotFoundError when the security isn't visible to the household", async () => {
    const securityRepo = createMockSecurityRepository();
    securityRepo.findVisible.mockResolvedValue(null);

    await expect(
      updateSecurity({ securityRepo }, { householdId: "h_demo", securityId: 999, name: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(securityRepo.findVisible).toHaveBeenCalledWith("h_demo", 999);
    expect(securityRepo.update).not.toHaveBeenCalled();
  });

  it("refuses to edit an exchange security", async () => {
    const securityRepo = createMockSecurityRepository();
    securityRepo.findVisible.mockResolvedValue(buildSecurity());

    await expect(
      updateSecurity({ securityRepo }, { householdId: "h_demo", securityId: 1, name: "x" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(securityRepo.update).not.toHaveBeenCalled();
  });

  it("merges only the provided mutable fields of a private security", async () => {
    const securityRepo = createMockSecurityRepository();
    const existing = buildSecurity({ owner_household_id: "h_demo" });
    securityRepo.findVisible.mockResolvedValue(existing);

    await updateSecurity(
      { securityRepo },
      { householdId: "h_demo", securityId: 1, name: "Sberbank PJSC" },
    );

    expect(securityRepo.update).toHaveBeenCalledWith({ ...existing, name: "Sberbank PJSC" });
  });

  it("keeps all fields unchanged when no updates are provided", async () => {
    const securityRepo = createMockSecurityRepository();
    const existing = buildSecurity({ owner_household_id: "h_demo" });
    securityRepo.findVisible.mockResolvedValue(existing);

    await updateSecurity({ securityRepo }, { householdId: "h_demo", securityId: 1 });

    expect(securityRepo.update).toHaveBeenCalledWith(existing);
  });
});
