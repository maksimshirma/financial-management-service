import { archiveCategory } from "../archive-category.js";
import { createMockCategoryRepository } from "./mock-category-repository.js";

describe("archiveCategory", () => {
  it("delegates to categoryRepo.archive", async () => {
    const categoryRepo = createMockCategoryRepository();

    await archiveCategory({ categoryRepo }, 1);

    expect(categoryRepo.archive).toHaveBeenCalledWith(1);
  });
});
