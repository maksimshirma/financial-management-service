import { CategoriesTable, NotFoundError } from "../../domain";
import { CategoryRepository } from "../ports";

export interface UpdateCategoryInput {
  categoryId: CategoriesTable["category_id"];
  name: string;
}

/**
 * @throws {NotFoundError} category does not exist
 * @throws {DuplicateEntryError} name already taken
 */
export async function updateCategory(
  deps: { categoryRepo: CategoryRepository },
  input: UpdateCategoryInput,
) {
  const existing = await deps.categoryRepo.findById(input.categoryId);
  if (!existing) throw new NotFoundError("Category", input.categoryId);

  await deps.categoryRepo.update({ ...existing, name: input.name });
}
