import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import {
  AccountType,
  CategoryType,
  Currency,
  MarketDataUnavailableError,
  SecurityType,
  type MarketDataProvider,
} from "@fms/core";
import {
  createKyselyInstance,
  KyselyAccountRepository,
  KyselyCategoryRepository,
  KyselySecurityRepository,
  KyselyTradeRepository,
  KyselyTransactionRepository,
} from "@fms/db";
import { testDatabaseConfig, truncateAllTables } from "@fms/fixtures";
import { APP_ID } from "../auth/verify-token";
import { createServer } from "../server";

const db = createKyselyInstance(testDatabaseConfig());
const marketData: jest.Mocked<MarketDataProvider> = {
  search: jest.fn(),
  getSpec: jest.fn(),
  getQuotes: jest.fn(),
  getCouponSchedule: jest.fn(),
};

let server: Server;
let baseUrl: string;
let sign: (hid: string, scope?: string[]) => Promise<string>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA");
  const jwk = { ...(await exportJWK(publicKey)), alg: "EdDSA" };
  sign = (hid, scope = ["app:edit"]) =>
    new SignJWT({ hid, scope })
      .setProtectedHeader({ alg: "EdDSA" })
      .setAudience(APP_ID)
      .setExpirationTime("5m")
      .sign(privateKey);

  const app = createServer(
    {
      accountRepo: new KyselyAccountRepository(db),
      categoryRepo: new KyselyCategoryRepository(db),
      securityRepo: new KyselySecurityRepository(db),
      transactionRepo: new KyselyTransactionRepository(db),
      tradeRepo: new KyselyTradeRepository(db),
      marketData,
      clock: { now: () => new Date("2026-10-06T12:00:00Z") },
    },
    { jwks: createLocalJWKSet({ keys: [jwk] }) },
  );
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  await truncateAllTables(db);
  jest.resetAllMocks();
  marketData.getSpec.mockResolvedValue({
    secid: "SBER",
    isin: "RU0009029540",
    name: "Сбербанк",
    type: SecurityType.STOCK,
    currency: Currency.RUB,
    boardId: "TQBR",
    market: "shares",
  });
  marketData.getQuotes.mockResolvedValue([
    { secid: "SBER", price: 300, priceUnit: "currency", at: new Date() },
  ]);
});

afterAll(async () => {
  server.close();
  await db.destroy();
});

async function call(method: string, path: string, hid?: string, body?: unknown, scope?: string[]) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (hid) headers.authorization = `Internal ${await sign(hid, scope)}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined };
}

async function seedAccount(hid: string, name = "Broker") {
  return (await call("POST", "/accounts", hid, { name, type: AccountType.BROKER, currency: Currency.RUB }))
    .body.account_id as number;
}

async function seedCategory(hid: string) {
  return (await call("POST", "/categories", hid, { name: "Еда", type: CategoryType.EXPENSE })).body
    .category_id as number;
}

async function importSber(hid: string) {
  return (await call("POST", "/securities/import", hid, { secid: "SBER" })).body.security_id as number;
}

describe("auth", () => {
  it("rejects a request without a token", async () => {
    expect((await call("GET", "/securities")).status).toBe(401);
  });

  it("rejects writes with a view-only token", async () => {
    expect((await call("POST", "/securities/import", "h_a", { secid: "SBER" }, ["app:view"])).status).toBe(403);
  });
});

describe("securities", () => {
  it("imports into the caller's list only", async () => {
    await importSber("h_a");

    expect((await call("GET", "/securities", "h_a")).body.map((s: { ticker: string }) => s.ticker)).toEqual(["SBER"]);
    expect((await call("GET", "/securities", "h_b")).body).toEqual([]);
  });

  it("archives for the caller only", async () => {
    const id = await importSber("h_a");
    await importSber("h_b");

    expect((await call("POST", `/securities/${id}/archive`, "h_a")).status).toBe(204);
    expect((await call("GET", "/securities", "h_a")).body).toEqual([]);
    expect((await call("GET", "/securities", "h_b")).body).toHaveLength(1);
  });

  it("refuses to edit an exchange security", async () => {
    const id = await importSber("h_a");
    expect((await call("PATCH", `/securities/${id}`, "h_a", { name: "x" })).status).toBe(403);
  });

  it("returns a quote, and 503 when the exchange is down", async () => {
    const id = await importSber("h_a");
    expect((await call("GET", `/securities/${id}/quote`, "h_a")).body).toMatchObject({ price: 300 });

    marketData.getQuotes.mockRejectedValue(new MarketDataUnavailableError("ISS down"));
    const res = await call("GET", `/securities/${id}/quote`, "h_a");
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("market_data_unavailable");
  });
});

describe("trades", () => {
  it("refuses buying on another household's account", async () => {
    const accountA = await seedAccount("h_a");
    const securityId = await importSber("h_b");

    const res = await call("POST", "/trades/buy", "h_b", { accountId: accountA, securityId, quantity: 1, price: 1 });

    expect(res.status).toBe(404);
    expect((await call("GET", "/securities", "h_a")).body).toEqual([]);
  });

  it("lists and deletes only the caller's trades; portfolio values own positions", async () => {
    const accountA = await seedAccount("h_a");
    const securityId = await importSber("h_a");
    const trade = (await call("POST", "/trades/buy", "h_a", { accountId: accountA, securityId, quantity: 10, price: 280 })).body;

    expect((await call("GET", "/trades", "h_b")).body).toEqual([]);
    expect((await call("DELETE", `/trades/${trade.trade_id}`, "h_b")).status).toBe(404);
    expect((await call("GET", "/portfolio/value", "h_a")).body.totals).toEqual({ RUB: 3000 });
    expect((await call("GET", "/portfolio/value", "h_b")).body.positions).toEqual([]);
    expect((await call("DELETE", `/trades/${trade.trade_id}`, "h_a")).status).toBe(204);
  });
});

describe("transactions", () => {
  it("refuses another household's category and transfer target; lists own only", async () => {
    const accountA = await seedAccount("h_a", "Card");
    const accountA2 = await seedAccount("h_a", "Cash");
    const categoryA = await seedCategory("h_a");
    const accountB = await seedAccount("h_b", "Card");
    const categoryB = await seedCategory("h_b");

    expect((await call("POST", "/transactions", "h_a", { accountId: accountA, amount: 100, categoryId: categoryB })).status).toBe(404);
    expect((await call("POST", "/transactions/transfer", "h_a", { accountId: accountA, toAccountId: accountB, amount: 100 })).status).toBe(404);

    expect((await call("POST", "/transactions", "h_a", { accountId: accountA, amount: 100, categoryId: categoryA })).status).toBe(201);
    expect((await call("POST", "/transactions/transfer", "h_a", { accountId: accountA, toAccountId: accountA2, amount: 50 })).status).toBe(201);

    expect((await call("GET", "/transactions", "h_a")).body).toHaveLength(2);
    expect((await call("GET", "/transactions", "h_b")).body).toEqual([]);
  });
});
