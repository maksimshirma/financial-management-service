import { CategoryType, DuplicateEntryError, NotFoundError } from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselyCategoryRepository } from "../../src/repositories/kysely-category-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselyCategoryRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

test("create returns the row with a generated id", async () => {
  const category = await repo.create({
    name: "Groceries",
    type: CategoryType.EXPENSE,
    is_archived: false,
  });
  expect(category.category_id).toEqual(expect.any(Number));
  expect(category.name).toBe("Groceries");
});

test("create rejects a duplicate name", async () => {
  await repo.create({ name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  await expect(
    repo.create({ name: "Groceries", type: CategoryType.INCOME, is_archived: false }),
  ).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("findById / findByName return null when nothing matches", async () => {
  await expect(repo.findById(999999)).resolves.toBeNull();
  await expect(repo.findByName("Nope")).resolves.toBeNull();
});

test("listAll excludes archived, listArchived returns only archived", async () => {
  const active = await repo.create({ name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  const toArchive = await repo.create({ name: "Salary", type: CategoryType.INCOME, is_archived: false });
  await repo.archive(toArchive.category_id);

  expect((await repo.listAll()).map((c) => c.category_id)).toEqual([active.category_id]);
  expect((await repo.listArchived()).map((c) => c.category_id)).toEqual([toArchive.category_id]);
});

test("update renames and rejects a name collision", async () => {
  const category = await repo.create({ name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  await repo.update({ ...category, name: "Food" });
  await expect(repo.findById(category.category_id)).resolves.toMatchObject({ name: "Food" });

  await repo.create({ name: "Salary", type: CategoryType.INCOME, is_archived: false });
  await expect(repo.update({ ...category, name: "Salary" })).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("update on a missing id throws NotFoundError", async () => {
  await expect(
    repo.update({ category_id: 999999, name: "x", type: CategoryType.EXPENSE, is_archived: false }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("archive flips is_archived", async () => {
  const category = await repo.create({ name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  await repo.archive(category.category_id);
  await expect(repo.findById(category.category_id)).resolves.toMatchObject({ is_archived: true });
});

test("archive on a missing id throws NotFoundError", async () => {
  await expect(repo.archive(999999)).rejects.toBeInstanceOf(NotFoundError);
});
