import { Kysely } from "kysely";
import {
  CategoriesTable,
  CategoryRepository,
  NewCategory,
  NotFoundError,
} from "@fms/core";
import { Database } from "../schema.js";
import { mapPgError } from "../errors.js";

export class KyselyCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(
    categoryId: CategoriesTable["category_id"],
  ): Promise<CategoriesTable | null> {
    const row = await this.db
      .selectFrom("categories")
      .selectAll()
      .where("category_id", "=", categoryId)
      .executeTakeFirst();
    return row ?? null;
  }

  async findByName(
    name: CategoriesTable["name"],
  ): Promise<CategoriesTable | null> {
    const row = await this.db
      .selectFrom("categories")
      .selectAll()
      .where("name", "=", name)
      .executeTakeFirst();
    return row ?? null;
  }

  async listAll(): Promise<CategoriesTable[]> {
    return this.db
      .selectFrom("categories")
      .selectAll()
      .where("is_archived", "=", false)
      .execute();
  }

  async listArchived(): Promise<CategoriesTable[]> {
    return this.db
      .selectFrom("categories")
      .selectAll()
      .where("is_archived", "=", true)
      .execute();
  }

  async create(category: NewCategory): Promise<CategoriesTable> {
    return this.db
      .insertInto("categories")
      .values(category)
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((err) => mapPgError(err, "Category"));
  }

  async update(category: CategoriesTable): Promise<void> {
    const { category_id, ...fields } = category;
    const result = await this.db
      .updateTable("categories")
      .set(fields)
      .where("category_id", "=", category_id)
      .executeTakeFirst()
      .catch((err) => mapPgError(err, "Category"));

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Category", category_id);
    }
  }

  async archive(categoryId: CategoriesTable["category_id"]): Promise<void> {
    const result = await this.db
      .updateTable("categories")
      .set({ is_archived: true })
      .where("category_id", "=", categoryId)
      .executeTakeFirst();

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Category", categoryId);
    }
  }
}
