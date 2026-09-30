import {
  CategoriesTable,
  DuplicateEntryError,
  NewCategory,
  NotFoundError,
} from "../../domain";

export interface CategoryRepository {
  findById(
    categoryId: CategoriesTable["category_id"],
  ): Promise<CategoriesTable | null>;
  findByName(name: CategoriesTable["name"]): Promise<CategoriesTable | null>;
  listAll(): Promise<CategoriesTable[]>;
  listArchived(): Promise<CategoriesTable[]>;
  /** @throws {DuplicateEntryError} name already taken */
  create(category: NewCategory): Promise<CategoriesTable>;
  /**
   * @throws {NotFoundError} category does not exist
   * @throws {DuplicateEntryError} name already taken
   */
  update(category: CategoriesTable): Promise<void>;
  /** @throws {NotFoundError} category does not exist */
  archive(categoryId: CategoriesTable["category_id"]): Promise<void>;
}
