import { AccountType, Currency, DuplicateEntryError, NotFoundError } from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselyAccountRepository } from "../../src/repositories/kysely-account-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselyAccountRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

async function seedUser() {
  const row = await db
    .insertInto("users")
    .values({ name: "Test User" })
    .returningAll()
    .executeTakeFirstOrThrow();
  return row.user_id;
}

test("create returns the row with a generated id", async () => {
  const userId = await seedUser();
  const account = await repo.create({
    user_id: userId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });
  expect(account.account_id).toEqual(expect.any(Number));
  expect(account.name).toBe("Cash");
});

test("create rejects a duplicate (user_id, name)", async () => {
  const userId = await seedUser();
  await repo.create({
    user_id: userId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });

  await expect(
    repo.create({
      user_id: userId,
      name: "Cash",
      type: AccountType.CASH,
      currency: Currency.RUB,
      is_archived: false,
    }),
  ).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("findById returns null when nothing matches", async () => {
  await expect(repo.findById(999999)).resolves.toBeNull();
});

test("findByName finds within a user, not across users", async () => {
  const userId = await seedUser();
  await repo.create({
    user_id: userId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });

  await expect(repo.findByName(userId, "Cash")).resolves.not.toBeNull();
  await expect(repo.findByName(userId, "Nope")).resolves.toBeNull();
});

test("findAllByUser excludes archived, findArchivedByUser returns only archived", async () => {
  const userId = await seedUser();
  const active = await repo.create({
    user_id: userId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });
  const toArchive = await repo.create({
    user_id: userId,
    name: "Card",
    type: AccountType.CARD,
    currency: Currency.RUB,
    is_archived: false,
  });
  await repo.archive(toArchive.account_id);

  const activeAccounts = await repo.findAllByUser(userId);
  expect(activeAccounts.map((a) => a.account_id)).toEqual([active.account_id]);

  const archivedAccounts = await repo.findArchivedByUser(userId);
  expect(archivedAccounts.map((a) => a.account_id)).toEqual([toArchive.account_id]);
});

test("update changes fields and rejects a name collision", async () => {
  const userId = await seedUser();
  const account = await repo.create({
    user_id: userId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });

  await repo.update({ ...account, name: "Renamed" });
  await expect(repo.findById(account.account_id)).resolves.toMatchObject({ name: "Renamed" });

  await repo.create({
    user_id: userId,
    name: "Card",
    type: AccountType.CARD,
    currency: Currency.RUB,
    is_archived: false,
  });
  await expect(
    repo.update({ ...account, name: "Card" }),
  ).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("update on a missing id throws NotFoundError", async () => {
  await expect(
    repo.update({
      account_id: 999999,
      user_id: 1,
      name: "x",
      type: AccountType.CASH,
      currency: Currency.RUB,
      is_archived: false,
    }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("archive flips is_archived", async () => {
  const userId = await seedUser();
  const account = await repo.create({
    user_id: userId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });

  await repo.archive(account.account_id);
  await expect(repo.findById(account.account_id)).resolves.toMatchObject({ is_archived: true });
});

test("archive on a missing id throws NotFoundError", async () => {
  await expect(repo.archive(999999)).rejects.toBeInstanceOf(NotFoundError);
});
