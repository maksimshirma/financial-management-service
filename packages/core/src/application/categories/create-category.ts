import { CategoryType, NewCategory } from "../../domain/index.js";
import { CategoryRepository } from "../ports/index.js";

export interface CreateCategoryInput {
  householdId: NewCategory["household_id"];
  name: string;
  type: CategoryType;
}

/** @throws {DuplicateEntryError} (household_id, name) already taken */
export async function createCategory(
  deps: { categoryRepo: CategoryRepository },
  input: CreateCategoryInput,
) {
  const category: NewCategory = {
    household_id: input.householdId,
    name: input.name,
    type: input.type,
    is_archived: false,
  };
  return deps.categoryRepo.create(category);
}
