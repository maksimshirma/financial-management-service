import {
  CategoriesTable,
  DuplicateEntryError,
  NewCategory,
  NotFoundError,
} from "../../domain/index.js";

export interface CategoryRepository {
  findById(
    categoryId: CategoriesTable["category_id"],
  ): Promise<CategoriesTable | null>;
  findByName(
    householdId: CategoriesTable["household_id"],
    name: CategoriesTable["name"],
  ): Promise<CategoriesTable | null>;
  listAllByHousehold(
    householdId: CategoriesTable["household_id"],
  ): Promise<CategoriesTable[]>;
  listArchivedByHousehold(
    householdId: CategoriesTable["household_id"],
  ): Promise<CategoriesTable[]>;
  /** @throws {DuplicateEntryError} (household_id, name) already taken */
  create(category: NewCategory): Promise<CategoriesTable>;
  /**
   * @throws {NotFoundError} category does not exist
   * @throws {DuplicateEntryError} (household_id, name) already taken
   */
  update(category: CategoriesTable): Promise<void>;
  /** @throws {NotFoundError} category does not exist */
  archive(categoryId: CategoriesTable["category_id"]): Promise<void>;
}
