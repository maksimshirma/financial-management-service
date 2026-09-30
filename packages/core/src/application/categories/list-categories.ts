import { CategoryRepository } from "../ports";

export async function listCategories(deps: {
  categoryRepo: CategoryRepository;
}) {
  return deps.categoryRepo.listAll();
}
