import { CategoryType, NewCategory } from "../../domain";
import { CategoryRepository } from "../ports";

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
}

/** @throws {DuplicateEntryError} name already taken */
export async function createCategory(
  deps: { categoryRepo: CategoryRepository },
  input: CreateCategoryInput,
) {
  const category: NewCategory = {
    name: input.name,
    type: input.type,
    is_archived: false,
  };
  return deps.categoryRepo.create(category);
}
