import { buildCategory, createMockCategoryRepository } from "./mock-category-repository.js";
import { listArchivedCategories } from "../list-archived-categories.js";

describe("listArchivedCategories", () => {
  it("delegates to categoryRepo.listArchivedByHousehold", async () => {
    const categoryRepo = createMockCategoryRepository();
    const categories = [buildCategory({ is_archived: true })];
    categoryRepo.listArchivedByHousehold.mockResolvedValue(categories);

    const result = await listArchivedCategories({ categoryRepo }, "h_demo");

    expect(categoryRepo.listArchivedByHousehold).toHaveBeenCalledWith("h_demo");
    expect(result).toBe(categories);
  });
});
