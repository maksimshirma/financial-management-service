import { CategoryType, DuplicateEntryError, NotFoundError } from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselyCategoryRepository } from "../../src/repositories/kysely-category-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselyCategoryRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

function seedHousehold() {
  return "h_demo";
}

test("create returns the row with a generated id", async () => {
  const householdId = seedHousehold();
  const category = await repo.create({
    household_id: householdId,
    name: "Groceries",
    type: CategoryType.EXPENSE,
    is_archived: false,
  });
  expect(category.category_id).toEqual(expect.any(Number));
  expect(category.name).toBe("Groceries");
});

test("create rejects a duplicate (household_id, name)", async () => {
  const householdId = seedHousehold();
  await repo.create({ household_id: householdId, name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  await expect(
    repo.create({ household_id: householdId, name: "Groceries", type: CategoryType.INCOME, is_archived: false }),
  ).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("findById / findByName return null when nothing matches", async () => {
  const householdId = seedHousehold();
  await expect(repo.findById(999999)).resolves.toBeNull();
  await expect(repo.findByName(householdId, "Nope")).resolves.toBeNull();
});

test("findByName finds within a household, not across households", async () => {
  const householdId = seedHousehold();
  await repo.create({ household_id: householdId, name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });

  await expect(repo.findByName(householdId, "Groceries")).resolves.not.toBeNull();
  await expect(repo.findByName("h_other", "Groceries")).resolves.toBeNull();
});

test("listAllByHousehold excludes archived, listArchivedByHousehold returns only archived", async () => {
  const householdId = seedHousehold();
  const active = await repo.create({ household_id: householdId, name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  const toArchive = await repo.create({ household_id: householdId, name: "Salary", type: CategoryType.INCOME, is_archived: false });
  await repo.archive(toArchive.category_id);

  expect((await repo.listAllByHousehold(householdId)).map((c) => c.category_id)).toEqual([active.category_id]);
  expect((await repo.listArchivedByHousehold(householdId)).map((c) => c.category_id)).toEqual([toArchive.category_id]);
});

test("update renames and rejects a name collision", async () => {
  const householdId = seedHousehold();
  const category = await repo.create({ household_id: householdId, name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  await repo.update({ ...category, name: "Food" });
  await expect(repo.findById(category.category_id)).resolves.toMatchObject({ name: "Food" });

  await repo.create({ household_id: householdId, name: "Salary", type: CategoryType.INCOME, is_archived: false });
  await expect(repo.update({ ...category, name: "Salary" })).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("update on a missing id throws NotFoundError", async () => {
  const householdId = seedHousehold();
  await expect(
    repo.update({ category_id: 999999, household_id: householdId, name: "x", type: CategoryType.EXPENSE, is_archived: false }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("archive flips is_archived", async () => {
  const householdId = seedHousehold();
  const category = await repo.create({ household_id: householdId, name: "Groceries", type: CategoryType.EXPENSE, is_archived: false });
  await repo.archive(category.category_id);
  await expect(repo.findById(category.category_id)).resolves.toMatchObject({ is_archived: true });
});

test("archive on a missing id throws NotFoundError", async () => {
  await expect(repo.archive(999999)).rejects.toBeInstanceOf(NotFoundError);
});
