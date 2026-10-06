import {
  Currency,
  DuplicateEntryError,
  NewSecurity,
  NotFoundError,
  SecurityType,
} from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselySecurityRepository } from "../../src/repositories/kysely-security-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselySecurityRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

const sber: NewSecurity = {
  ticker: "SBER",
  isin: "RU0009029540",
  name: "Сбербанк",
  type: SecurityType.STOCK,
  currency: Currency.RUB,
  board_id: "TQBR",
  market: "shares",
};

function privateSecurity(householdId: string, overrides: Partial<NewSecurity> = {}): NewSecurity {
  return {
    ticker: "AAPL",
    name: "Apple",
    type: SecurityType.STOCK,
    currency: Currency.USD,
    owner_household_id: householdId,
    ...overrides,
  };
}

test("create returns the row with a generated id", async () => {
  const security = await repo.create(sber);
  expect(security.security_id).toEqual(expect.any(Number));
});

test("create rejects a duplicate exchange ticker", async () => {
  await repo.create(sber);
  await expect(repo.create({ ...sber, isin: undefined, name: "Sber 2" })).rejects.toBeInstanceOf(
    DuplicateEntryError,
  );
});

test("create rejects a duplicate exchange isin", async () => {
  await repo.create(sber);
  await expect(repo.create({ ...sber, ticker: "SBER2" })).rejects.toBeInstanceOf(
    DuplicateEntryError,
  );
});

test("private tickers are unique per household only", async () => {
  await repo.create(privateSecurity("h_a"));
  await expect(repo.create(privateSecurity("h_b"))).resolves.toMatchObject({ ticker: "AAPL" });
  await expect(repo.create(privateSecurity("h_a"))).rejects.toBeInstanceOf(DuplicateEntryError);
});

test("optional fields roundtrip as undefined, not null", async () => {
  const security = await repo.create(privateSecurity("h_a"));
  expect(security.isin).toBeUndefined();
  expect(security.face_value).toBeUndefined();
  expect(security.board_id).toBeUndefined();
  expect(security.synced_at).toBeUndefined();

  const found = await repo.findById(security.security_id);
  expect(found?.isin).toBeUndefined();
  expect(found?.owner_household_id).toBe("h_a");
});

test("bond fields roundtrip with correct numeric types", async () => {
  const bond = await repo.create({
    ticker: "SU26238RMFS4",
    isin: "RU000A1038V6",
    name: "ОФЗ 26238",
    type: SecurityType.BOND,
    currency: Currency.RUB,
    face_value: 1000,
    coupon_rate: 7.1,
    maturity_date: new Date("2041-05-15"),
  });

  expect(typeof bond.face_value).toBe("number");
  expect(bond.face_value).toBe(1000);
  expect(typeof bond.coupon_rate).toBe("number");
  expect(bond.coupon_rate).toBe(7.1);
});

test("findVisible sees exchange and own private securities, not another household's", async () => {
  const exchange = await repo.create(sber);
  const mine = await repo.create(privateSecurity("h_a"));
  const theirs = await repo.create(privateSecurity("h_b"));

  await expect(repo.findVisible("h_a", exchange.security_id)).resolves.toMatchObject({ ticker: "SBER" });
  await expect(repo.findVisible("h_a", mine.security_id)).resolves.toMatchObject({ owner_household_id: "h_a" });
  await expect(repo.findVisible("h_a", theirs.security_id)).resolves.toBeNull();
});

test("findByTicker prefers the exchange security and hides other households' ones", async () => {
  const exchange = await repo.create(sber);
  await repo.create(privateSecurity("h_a", { ticker: "SBER" }));
  await repo.create(privateSecurity("h_b", { ticker: "PRIV" }));

  await expect(repo.findByTicker("h_a", "SBER")).resolves.toMatchObject({
    security_id: exchange.security_id,
  });
  await expect(repo.findByTicker("h_a", "PRIV")).resolves.toBeNull();
  await expect(repo.findByTicker("h_b", "PRIV")).resolves.toMatchObject({ ticker: "PRIV" });
});

test("upsertExchange inserts, then refreshes reference fields of the same ticker", async () => {
  const first = await repo.upsertExchange({ ...sber, synced_at: new Date("2026-10-01T00:00:00Z") });
  const second = await repo.upsertExchange({
    ...sber,
    name: "Сбербанк ПАО",
    synced_at: new Date("2026-10-06T00:00:00Z"),
  });

  expect(second.security_id).toBe(first.security_id);
  expect(second.name).toBe("Сбербанк ПАО");
  expect(second.synced_at).toEqual(new Date("2026-10-06T00:00:00Z"));
  expect(second.owner_household_id).toBeUndefined();
});

test("upsertExchange leaves a private security with the same ticker alone", async () => {
  const mine = await repo.create(privateSecurity("h_a", { ticker: "SBER", isin: undefined }));
  const exchange = await repo.upsertExchange(sber);

  expect(exchange.security_id).not.toBe(mine.security_id);
  await expect(repo.findById(mine.security_id)).resolves.toMatchObject({ name: "Apple" });
});

test("link is idempotent and lists the security for that household only", async () => {
  const security = await repo.create(sber);

  await repo.link("h_a", security.security_id);
  await repo.link("h_a", security.security_id);

  expect((await repo.listByHousehold("h_a")).map((s) => s.ticker)).toEqual(["SBER"]);
  await expect(repo.listByHousehold("h_b")).resolves.toEqual([]);
});

test("archiveLink hides the security for one household only; link un-archives it", async () => {
  const security = await repo.create(sber);
  await repo.link("h_a", security.security_id);
  await repo.link("h_b", security.security_id);

  await repo.archiveLink("h_a", security.security_id);

  await expect(repo.listByHousehold("h_a")).resolves.toEqual([]);
  expect((await repo.listArchivedByHousehold("h_a")).map((s) => s.ticker)).toEqual(["SBER"]);
  expect((await repo.listByHousehold("h_b")).map((s) => s.ticker)).toEqual(["SBER"]);

  await repo.link("h_a", security.security_id);
  expect((await repo.listByHousehold("h_a")).map((s) => s.ticker)).toEqual(["SBER"]);
});

test("archiveLink throws NotFoundError when the security isn't on the household's list", async () => {
  const security = await repo.create(sber);
  await expect(repo.archiveLink("h_a", security.security_id)).rejects.toBeInstanceOf(NotFoundError);
});

test("link to a missing security throws NotFoundError", async () => {
  await expect(repo.link("h_a", 999999)).rejects.toBeInstanceOf(NotFoundError);
});

test("update changes mutable fields", async () => {
  const security = await repo.create(privateSecurity("h_a"));
  await repo.update({ ...security, name: "Apple Inc." });
  await expect(repo.findById(security.security_id)).resolves.toMatchObject({ name: "Apple Inc." });
});

test("update on a missing id throws NotFoundError", async () => {
  await expect(
    repo.update({ security_id: 999999, ticker: "X", name: "X", type: SecurityType.STOCK, currency: Currency.RUB }),
  ).rejects.toBeInstanceOf(NotFoundError);
});
