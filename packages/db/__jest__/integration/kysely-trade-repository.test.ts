import { AccountType, Currency, NotFoundError, SecurityType, TradeType } from "@fms/core";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { createKyselyInstance } from "../../src";
import { KyselyTradeRepository } from "../../src/repositories/kysely-trade-repository";

const db = createKyselyInstance(testDatabaseConfig());
const repo = new KyselyTradeRepository(db);

beforeEach(() => truncateAllTables(db));
afterAll(() => db.destroy());

async function seedAccount() {
  const account = await db
    .insertInto("accounts")
    .values({ user_id: 1, name: "Broker", type: AccountType.BROKER, currency: Currency.RUB, is_archived: false })
    .returningAll()
    .executeTakeFirstOrThrow();
  return account.account_id;
}

async function seedSecurity(ticker = "SBER") {
  const security = await db
    .insertInto("securities")
    .values({ ticker, name: "Sberbank", type: SecurityType.STOCK, currency: Currency.RUB, is_archived: false })
    .returningAll()
    .executeTakeFirstOrThrow();
  return security.security_id;
}

test("create returns the row with a generated id and correct numeric types", async () => {
  const accountId = await seedAccount();
  const securityId = await seedSecurity();

  const trade = await repo.create({
    date: new Date("2026-09-16"),
    account_id: accountId,
    security_id: securityId,
    type: TradeType.BUY,
    quantity: 50,
    price: 280.5,
    accrued_interest: 0,
    fee: 15,
  });

  expect(trade.trade_id).toEqual(expect.any(Number));
  expect(typeof trade.price).toBe("number");
  expect(trade.price).toBe(280.5);
});

test("create with a nonexistent account throws NotFoundError", async () => {
  const securityId = await seedSecurity();
  await expect(
    repo.create({
      date: new Date(),
      account_id: 999999,
      security_id: securityId,
      type: TradeType.BUY,
      quantity: 1,
      price: 1,
      accrued_interest: 0,
      fee: 0,
    }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("find combines accountId and securityId filters", async () => {
  const accountId = await seedAccount();
  const securityA = await seedSecurity("SBER");
  const securityB = await seedSecurity("LQDT");

  const tradeA = await repo.create({ date: new Date("2026-09-16"), account_id: accountId, security_id: securityA, type: TradeType.BUY, quantity: 1, price: 1, accrued_interest: 0, fee: 0 });
  await repo.create({ date: new Date("2026-09-17"), account_id: accountId, security_id: securityB, type: TradeType.BUY, quantity: 1, price: 1, accrued_interest: 0, fee: 0 });

  const byAccount = await repo.find({ accountId });
  expect(byAccount).toHaveLength(2);

  const bySecurity = await repo.find({ securityId: securityA });
  expect(bySecurity.map((t) => t.trade_id)).toEqual([tradeA.trade_id]);

  const combined = await repo.find({ accountId, securityId: securityA });
  expect(combined.map((t) => t.trade_id)).toEqual([tradeA.trade_id]);
});

test("find filters by date range", async () => {
  const accountId = await seedAccount();
  const securityId = await seedSecurity();

  const early = await repo.create({ date: new Date("2026-01-01"), account_id: accountId, security_id: securityId, type: TradeType.BUY, quantity: 1, price: 1, accrued_interest: 0, fee: 0 });
  const late = await repo.create({ date: new Date("2026-12-01"), account_id: accountId, security_id: securityId, type: TradeType.SELL, quantity: 1, price: 1, accrued_interest: 0, fee: 0 });

  const inRange = await repo.find({ from: new Date("2026-06-01"), to: new Date("2026-12-31") });
  expect(inRange.map((t) => t.trade_id)).toEqual([late.trade_id]);
  expect(inRange.map((t) => t.trade_id)).not.toContain(early.trade_id);
});

test("update changes fields, missing id throws NotFoundError", async () => {
  const accountId = await seedAccount();
  const securityId = await seedSecurity();
  const trade = await repo.create({ date: new Date("2026-09-16"), account_id: accountId, security_id: securityId, type: TradeType.BUY, quantity: 50, price: 280.5, accrued_interest: 0, fee: 15 });

  await repo.update({ ...trade, quantity: 60 });
  await expect(repo.findById(trade.trade_id)).resolves.toMatchObject({ quantity: 60 });

  await expect(
    repo.update({ ...trade, trade_id: 999999 }),
  ).rejects.toBeInstanceOf(NotFoundError);
});

test("delete removes the row, missing id throws NotFoundError", async () => {
  const accountId = await seedAccount();
  const securityId = await seedSecurity();
  const trade = await repo.create({ date: new Date("2026-09-16"), account_id: accountId, security_id: securityId, type: TradeType.BUY, quantity: 1, price: 1, accrued_interest: 0, fee: 0 });

  await repo.delete(trade.trade_id);
  await expect(repo.findById(trade.trade_id)).resolves.toBeNull();
  await expect(repo.delete(trade.trade_id)).rejects.toBeInstanceOf(NotFoundError);
});
