import { buildCategory, createMockCategoryRepository } from "./mock-category-repository.js";
import { listCategories } from "../list-categories.js";

describe("listCategories", () => {
  it("delegates to categoryRepo.listAll", async () => {
    const categoryRepo = createMockCategoryRepository();
    const categories = [buildCategory()];
    categoryRepo.listAll.mockResolvedValue(categories);

    const result = await listCategories({ categoryRepo });

    expect(categoryRepo.listAll).toHaveBeenCalled();
    expect(result).toBe(categories);
  });
});
