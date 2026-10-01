import { CategoryRepository } from "../ports/index.js";

export async function listCategories(deps: {
  categoryRepo: CategoryRepository;
}) {
  return deps.categoryRepo.listAll();
}
