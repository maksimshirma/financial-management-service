import { buildCategory, createMockCategoryRepository } from "./mock-category-repository";
import { listArchivedCategories } from "../list-archived-categories";

describe("listArchivedCategories", () => {
  it("delegates to categoryRepo.listArchived", async () => {
    const categoryRepo = createMockCategoryRepository();
    const categories = [buildCategory({ is_archived: true })];
    categoryRepo.listArchived.mockResolvedValue(categories);

    const result = await listArchivedCategories({ categoryRepo });

    expect(categoryRepo.listArchived).toHaveBeenCalled();
    expect(result).toBe(categories);
  });
});
