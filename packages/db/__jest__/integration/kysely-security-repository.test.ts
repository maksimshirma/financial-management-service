import { Currency, DuplicateEntryError, NotFoundError, SecurityType } from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselySecurityRepository } from "../../src/repositories/kysely-security-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselySecurityRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

test("create returns the row with a generated id", async () => {
  const security = await repo.create({
    ticker: "SBER",
    name: "Sberbank",
    type: SecurityType.STOCK,
    currency: Currency.RUB,
    is_archived: false,
  });
  expect(security.security_id).toEqual(expect.any(Number));
});

test("create rejects a duplicate ticker", async () => {
  await repo.create({ ticker: "SBER", name: "Sberbank", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false });
  await expect(
    repo.create({ ticker: "SBER", name: "Sberbank 2", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false }),
  ).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("create rejects a duplicate isin", async () => {
  await repo.create({ ticker: "SBER", isin: "RU0009029540", name: "Sberbank", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false });
  await expect(
    repo.create({ ticker: "SBER2", isin: "RU0009029540", name: "Sberbank 2", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false }),
  ).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("optional fields roundtrip as undefined, not null", async () => {
  const security = await repo.create({
    ticker: "SBER",
    name: "Sberbank",
    type: SecurityType.STOCK,
    currency: Currency.RUB,
    is_archived: false,
  });
  expect(security.isin).toBeUndefined();
  expect(security.face_value).toBeUndefined();
  expect(security.coupon_rate).toBeUndefined();
  expect(security.maturity_date).toBeUndefined();

  const found = await repo.findById(security.security_id);
  expect(found?.isin).toBeUndefined();
});

test("bond fields roundtrip with correct numeric types", async () => {
  const bond = await repo.create({
    ticker: "SU26238",
    isin: "RU000A1038V6",
    name: "OFZ 26238",
    type: SecurityType.BOND,
    currency: Currency.RUB,
    face_value: 1000,
    coupon_rate: 7.1,
    maturity_date: new Date("2041-05-15"),
    is_archived: false,
  });

  expect(typeof bond.face_value).toBe("number");
  expect(bond.face_value).toBe(1000);
  expect(typeof bond.coupon_rate).toBe("number");
  expect(bond.coupon_rate).toBe(7.1);
});

test("findByTicker / findByIsin", async () => {
  await repo.create({ ticker: "SBER", isin: "RU0009029540", name: "Sberbank", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false });

  await expect(repo.findByTicker("SBER")).resolves.toMatchObject({ ticker: "SBER" });
  await expect(repo.findByTicker("NOPE")).resolves.toBeNull();
  await expect(repo.findByIsin("RU0009029540")).resolves.toMatchObject({ ticker: "SBER" });
  await expect(repo.findByIsin(undefined)).resolves.toBeNull();
});

test("listAll excludes archived, listArchived returns only archived", async () => {
  const active = await repo.create({ ticker: "SBER", name: "Sberbank", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false });
  const toArchive = await repo.create({ ticker: "LQDT", name: "Liquidity", type: SecurityType.FUND, currency: Currency.RUB, is_archived: false });
  await repo.archive(toArchive.security_id);

  expect((await repo.listAll()).map((s) => s.security_id)).toEqual([active.security_id]);
  expect((await repo.listArchived()).map((s) => s.security_id)).toEqual([toArchive.security_id]);
});

test("update changes mutable fields", async () => {
  const security = await repo.create({ ticker: "SBER", name: "Sberbank", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false });
  await repo.update({ ...security, name: "Sberbank PJSC" });
  await expect(repo.findById(security.security_id)).resolves.toMatchObject({ name: "Sberbank PJSC" });
});

test("update on a missing id throws NotFoundError", async () => {
  await expect(
    repo.update({ security_id: 999999, ticker: "X", name: "X", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("archive on a missing id throws NotFoundError", async () => {
  await expect(repo.archive(999999)).rejects.toBeInstanceOf(NotFoundError);
});
