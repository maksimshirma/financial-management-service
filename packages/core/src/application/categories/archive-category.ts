import { CategoriesTable } from "../../domain/index.js";
import { CategoryRepository } from "../ports/index.js";

/** @throws {NotFoundError} category does not exist */
export async function archiveCategory(
  deps: { categoryRepo: CategoryRepository },
  categoryId: CategoriesTable["category_id"],
) {
  await deps.categoryRepo.archive(categoryId);
}
