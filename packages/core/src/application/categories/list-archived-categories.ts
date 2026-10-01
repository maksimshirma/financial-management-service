import { CategoryRepository } from "../ports/index.js";

export async function listArchivedCategories(deps: {
  categoryRepo: CategoryRepository;
}) {
  return deps.categoryRepo.listArchived();
}
