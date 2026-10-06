import { CategoriesTable } from "../../domain/index.js";
import { CategoryRepository } from "../ports/index.js";

export async function listCategories(
  deps: { categoryRepo: CategoryRepository },
  householdId: CategoriesTable["household_id"],
) {
  return deps.categoryRepo.listAllByHousehold(householdId);
}
