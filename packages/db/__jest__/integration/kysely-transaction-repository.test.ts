import { AccountType, CategoryType, Currency, NotFoundError } from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselyTransactionRepository } from "../../src/repositories/kysely-transaction-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselyTransactionRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

function seedHousehold() {
  return "h_demo";
}

async function seedAccount(householdId: string, name = "Cash") {
  const row = await db
    .insertInto("accounts")
    .values({ household_id: householdId, name, type: AccountType.CASH, currency: Currency.RUB, is_archived: false })
    .returningAll()
    .executeTakeFirstOrThrow();
  return row.account_id;
}

async function seedCategory(householdId: string, type = CategoryType.EXPENSE) {
  const row = await db
    .insertInto("categories")
    .values({ household_id: householdId, name: `Category ${Math.random()}`, type, is_archived: false })
    .returningAll()
    .executeTakeFirstOrThrow();
  return row.category_id;
}

test("create (income/expense) returns the row with correct numeric amount", async () => {
  const householdId = seedHousehold();
  const accountId = await seedAccount(householdId);
  const categoryId = await seedCategory(householdId);

  const transaction = await repo.create({
    date: new Date("2026-09-06"),
    account_id: accountId,
    amount: 3500.5,
    category_id: categoryId,
    is_transfer: false,
  });

  expect(transaction.transaction_id).toEqual(expect.any(Number));
  expect(typeof transaction.amount).toBe("number");
  expect(transaction.amount).toBe(3500.5);
  expect(transaction.to_account_id).toBeUndefined();
  expect(transaction.to_amount).toBeUndefined();
  expect(transaction.security_id).toBeUndefined();
  expect(transaction.note).toBeUndefined();
});

test("create (transfer) roundtrips to_account_id/to_amount as undefined-safe optional fields", async () => {
  const householdId = seedHousehold();
  const accountId = await seedAccount(householdId, "Cash");
  const toAccountId = await seedAccount(householdId, "Broker");

  const transaction = await repo.create({
    date: new Date("2026-09-16"),
    account_id: accountId,
    amount: 20000,
    is_transfer: true,
    to_account_id: toAccountId,
    to_amount: 20000,
  });

  expect(transaction.category_id).toBeUndefined();
  expect(transaction.to_account_id).toBe(toAccountId);
  expect(transaction.to_amount).toBe(20000);

  const found = await repo.findById(transaction.transaction_id);
  expect(found?.to_account_id).toBe(toAccountId);
});

test("create with a nonexistent account throws NotFoundError", async () => {
  const householdId = seedHousehold();
  const categoryId = await seedCategory(householdId);
  await expect(
    repo.create({
      date: new Date(),
      account_id: 999999,
      amount: 1,
      category_id: categoryId,
      is_transfer: false,
    }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("create with a nonexistent category throws NotFoundError", async () => {
  const householdId = seedHousehold();
  const accountId = await seedAccount(householdId);
  await expect(
    repo.create({
      date: new Date(),
      account_id: accountId,
      amount: 1,
      category_id: 999999,
      is_transfer: false,
    }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("find combines accountId and date range filters", async () => {
  const householdId = seedHousehold();
  const accountA = await seedAccount(householdId, "Cash");
  const accountB = await seedAccount(householdId, "Card");
  const categoryId = await seedCategory(householdId);

  const early = await repo.create({ date: new Date("2026-01-01"), account_id: accountA, amount: 1, category_id: categoryId, is_transfer: false });
  const late = await repo.create({ date: new Date("2026-12-01"), account_id: accountA, amount: 1, category_id: categoryId, is_transfer: false });
  await repo.create({ date: new Date("2026-12-01"), account_id: accountB, amount: 1, category_id: categoryId, is_transfer: false });

  const byAccount = await repo.find({ accountId: accountA });
  expect(byAccount).toHaveLength(2);

  const combined = await repo.find({ accountId: accountA, from: new Date("2026-06-01"), to: new Date("2026-12-31") });
  expect(combined.map((t) => t.transaction_id)).toEqual([late.transaction_id]);
  expect(combined.map((t) => t.transaction_id)).not.toContain(early.transaction_id);
});

test("update changes fields, missing id throws NotFoundError", async () => {
  const householdId = seedHousehold();
  const accountId = await seedAccount(householdId);
  const categoryId = await seedCategory(householdId);
  const transaction = await repo.create({ date: new Date("2026-09-06"), account_id: accountId, amount: 100, category_id: categoryId, is_transfer: false });

  await repo.update({ ...transaction, note: "updated note" });
  await expect(repo.findById(transaction.transaction_id)).resolves.toMatchObject({ note: "updated note" });

  await expect(
    repo.update({ ...transaction, transaction_id: 999999 }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("delete removes the row, missing id throws NotFoundError", async () => {
  const householdId = seedHousehold();
  const accountId = await seedAccount(householdId);
  const categoryId = await seedCategory(householdId);
  const transaction = await repo.create({ date: new Date("2026-09-06"), account_id: accountId, amount: 100, category_id: categoryId, is_transfer: false });

  await repo.delete(transaction.transaction_id);
  await expect(repo.findById(transaction.transaction_id)).resolves.toBeNull();
  await expect(repo.delete(transaction.transaction_id)).rejects.toBeInstanceOf(NotFoundError);
});

test("find by householdId returns transactions on the household's accounts only", async () => {
  const mine = await seedAccount("h_a", "Card A");
  const mine2 = await seedAccount("h_a", "Cash A");
  const theirs = await seedAccount("h_b", "Card B");
  const categoryA = await seedCategory("h_a");
  const categoryB = await seedCategory("h_b");
  const expense = (account_id: number, category_id: number) =>
    repo.create({ date: new Date("2026-09-06"), account_id, amount: 100, category_id, is_transfer: false });
  await expense(mine, categoryA);
  await expense(mine2, categoryA);
  await expense(theirs, categoryB);

  const found = await repo.find({ householdId: "h_a" });

  expect(found.map((t) => t.account_id).sort()).toEqual([mine, mine2].sort());
  await expect(repo.find({ householdId: "h_a", accountId: theirs })).resolves.toEqual([]);
});
