import { CategoriesTable } from "../../domain";
import { CategoryRepository } from "../ports";

/** @throws {NotFoundError} category does not exist */
export async function archiveCategory(
  deps: { categoryRepo: CategoryRepository },
  categoryId: CategoriesTable["category_id"],
) {
  await deps.categoryRepo.archive(categoryId);
}
