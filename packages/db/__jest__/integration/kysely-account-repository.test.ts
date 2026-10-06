import { AccountType, Currency, DuplicateEntryError, NotFoundError } from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselyAccountRepository } from "../../src/repositories/kysely-account-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselyAccountRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

function seedHousehold() {
  return "h_demo";
}

test("create returns the row with a generated id", async () => {
  const householdId = await seedHousehold();
  const account = await repo.create({
    household_id: householdId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });
  expect(account.account_id).toEqual(expect.any(Number));
  expect(account.name).toBe("Cash");
});

test("create rejects a duplicate (household_id, name)", async () => {
  const householdId = await seedHousehold();
  await repo.create({
    household_id: householdId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });

  await expect(
    repo.create({
      household_id: householdId,
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

test("findByName finds within a household, not across households", async () => {
  const householdId = await seedHousehold();
  await repo.create({
    household_id: householdId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });

  await expect(repo.findByName(householdId, "Cash")).resolves.not.toBeNull();
  await expect(repo.findByName(householdId, "Nope")).resolves.toBeNull();
});

test("findAllByHousehold excludes archived, findArchivedByHousehold returns only archived", async () => {
  const householdId = await seedHousehold();
  const active = await repo.create({
    household_id: householdId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });
  const toArchive = await repo.create({
    household_id: householdId,
    name: "Card",
    type: AccountType.CARD,
    currency: Currency.RUB,
    is_archived: false,
  });
  await repo.archive(toArchive.account_id);

  const activeAccounts = await repo.findAllByHousehold(householdId);
  expect(activeAccounts.map((a) => a.account_id)).toEqual([active.account_id]);

  const archivedAccounts = await repo.findArchivedByHousehold(householdId);
  expect(archivedAccounts.map((a) => a.account_id)).toEqual([toArchive.account_id]);
});

test("update changes fields and rejects a name collision", async () => {
  const householdId = await seedHousehold();
  const account = await repo.create({
    household_id: householdId,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
  });

  await repo.update({ ...account, name: "Renamed" });
  await expect(repo.findById(account.account_id)).resolves.toMatchObject({ name: "Renamed" });

  await repo.create({
    household_id: householdId,
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
      household_id: "h_demo",
      name: "x",
      type: AccountType.CASH,
      currency: Currency.RUB,
      is_archived: false,
    }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("archive flips is_archived", async () => {
  const householdId = await seedHousehold();
  const account = await repo.create({
    household_id: householdId,
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
