import { CategoryType } from "../../../domain";
import { createCategory } from "../create-category";
import { buildCategory, createMockCategoryRepository } from "./mock-category-repository";

describe("createCategory", () => {
  it("builds a new category with is_archived defaulted to false", async () => {
    const categoryRepo = createMockCategoryRepository();
    const created = buildCategory();
    categoryRepo.create.mockResolvedValue(created);

    const result = await createCategory(
      { categoryRepo },
      { name: "Groceries", type: CategoryType.EXPENSE },
    );

    expect(categoryRepo.create).toHaveBeenCalledWith({
      name: "Groceries",
      type: CategoryType.EXPENSE,
      is_archived: false,
    });
    expect(result).toBe(created);
  });
});
