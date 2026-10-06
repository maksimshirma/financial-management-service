import { CategoryType } from "../../../domain/index.js";
import { createCategory } from "../create-category.js";
import { buildCategory, createMockCategoryRepository } from "./mock-category-repository.js";

describe("createCategory", () => {
  it("builds a new category with is_archived defaulted to false", async () => {
    const categoryRepo = createMockCategoryRepository();
    const created = buildCategory();
    categoryRepo.create.mockResolvedValue(created);

    const result = await createCategory(
      { categoryRepo },
      { householdId: "h_demo", name: "Groceries", type: CategoryType.EXPENSE },
    );

    expect(categoryRepo.create).toHaveBeenCalledWith({
      household_id: "h_demo",
      name: "Groceries",
      type: CategoryType.EXPENSE,
      is_archived: false,
    });
    expect(result).toBe(created);
  });
});
