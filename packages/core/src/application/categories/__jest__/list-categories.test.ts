import { buildCategory, createMockCategoryRepository } from "./mock-category-repository.js";
import { listCategories } from "../list-categories.js";

describe("listCategories", () => {
  it("delegates to categoryRepo.listAllByHousehold", async () => {
    const categoryRepo = createMockCategoryRepository();
    const categories = [buildCategory()];
    categoryRepo.listAllByHousehold.mockResolvedValue(categories);

    const result = await listCategories({ categoryRepo }, "h_demo");

    expect(categoryRepo.listAllByHousehold).toHaveBeenCalledWith("h_demo");
    expect(result).toBe(categories);
  });
});
