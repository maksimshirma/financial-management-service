import { CategoryRepository } from "../ports";

export async function listArchivedCategories(deps: {
  categoryRepo: CategoryRepository;
}) {
  return deps.categoryRepo.listArchived();
}
