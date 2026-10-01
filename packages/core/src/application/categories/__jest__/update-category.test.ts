import { NotFoundError } from "../../../domain";
import { updateCategory } from "../update-category";
import { buildCategory, createMockCategoryRepository } from "./mock-category-repository";

describe("updateCategory", () => {
  it("throws NotFoundError when the category doesn't exist", async () => {
    const categoryRepo = createMockCategoryRepository();
    categoryRepo.findById.mockResolvedValue(null);

    await expect(
      updateCategory({ categoryRepo }, { categoryId: 999, name: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(categoryRepo.update).not.toHaveBeenCalled();
  });

  it("renames the category, keeping its type unchanged", async () => {
    const categoryRepo = createMockCategoryRepository();
    const existing = buildCategory();
    categoryRepo.findById.mockResolvedValue(existing);

    await updateCategory({ categoryRepo }, { categoryId: 1, name: "Food" });

    expect(categoryRepo.update).toHaveBeenCalledWith({ ...existing, name: "Food" });
  });
});
