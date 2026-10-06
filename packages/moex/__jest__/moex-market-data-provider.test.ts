import { Currency, SecurityType } from "@fms/core";
import { MoexMarketDataProvider } from "../src/moex-market-data-provider";
import { createFakeFetch } from "./fake-fetch";

const routes = {
  "/securities.json": "search-sber.json",
  "/securities/SU26238RMFS4.json": "spec-SU26238RMFS4.json",
  "/securities/SBER.json": "spec-SBER.json",
  "/securities/LQDT.json": "spec-LQDT.json",
  "/securities/NOPE123.json": "spec-NOPE123.json",
  "/boards/TQBR/securities.json": "quotes-tqbr.json",
  "/boards/TQOB/securities.json": "quotes-tqob.json",
  "/bondization/SU26238RMFS4.json": "coupons-SU26238RMFS4.json",
};

function setup(now = () => 0) {
  const { fetchFn, calls } = createFakeFetch(routes);
  const provider = new MoexMarketDataProvider({ fetchFn, retries: 0, now });
  return { provider, calls };
}

describe("search", () => {
  it("maps supported types and drops the rest", async () => {
    const { provider, calls } = setup();

    const result = await provider.search("SBER");

    expect(result).toContainEqual({
      secid: "SBER",
      isin: "RU0009029540",
      name: "Сбербанк",
      type: SecurityType.STOCK,
      boardId: "TQBR",
    });
    expect(result.find((c) => c.secid === "RU000A10DS74")?.type).toBe(SecurityType.BOND);
    // stock_index_pf (FIXSBER) isn't something you can hold
    expect(result.map((c) => c.secid)).not.toContain("FIXSBER");
    expect(calls[0].searchParams.get("q")).toBe("SBER");
    expect(calls[0].searchParams.get("iss.meta")).toBe("off");
  });
});

describe("getSpec", () => {
  it("maps a bond with its primary board, face value, coupon and maturity", async () => {
    const { provider } = setup();

    expect(await provider.getSpec("SU26238RMFS4")).toEqual({
      secid: "SU26238RMFS4",
      isin: "RU000A1038V6",
      name: "ОФЗ 26238",
      type: SecurityType.BOND,
      currency: Currency.RUB,
      boardId: "TQOB",
      market: "bonds",
      faceValue: 1000,
      couponRate: 7.1,
      maturityDate: new Date("2041-05-15"),
    });
  });

  it("leaves bond-only fields empty for a stock", async () => {
    const { provider } = setup();

    const spec = await provider.getSpec("SBER");

    expect(spec).toMatchObject({ type: SecurityType.STOCK, boardId: "TQBR", market: "shares" });
    expect(spec?.faceValue).toBeUndefined();
  });

  it("maps an exchange-traded fund", async () => {
    const { provider } = setup();

    expect(await provider.getSpec("LQDT")).toMatchObject({
      type: SecurityType.FUND,
      isin: "RU000A1014L8",
      currency: Currency.RUB,
    });
  });

  it("returns null for an unknown code", async () => {
    const { provider } = setup();

    expect(await provider.getSpec("NOPE123")).toBeNull();
  });

  it("caches specs", async () => {
    const { provider, calls } = setup();

    await provider.getSpec("SBER");
    await provider.getSpec("SBER");

    expect(calls).toHaveLength(1);
  });
});

describe("getQuotes", () => {
  const sber = { secid: "SBER", boardId: "TQBR", market: "shares" };
  const lqdt = { secid: "LQDT", boardId: "TQBR", market: "shares" };
  const ofz = { secid: "SU26238RMFS4", boardId: "TQOB", market: "bonds" };

  it("fetches each board once and prices bonds as percent of face", async () => {
    const { provider, calls } = setup();

    const quotes = await provider.getQuotes([sber, ofz, lqdt]);

    expect(calls).toHaveLength(2);
    expect(calls[0].searchParams.get("securities")).toBe("SBER,LQDT");
    expect(quotes).toContainEqual({
      secid: "SBER",
      price: 282.69,
      priceUnit: "currency",
      accruedInterest: undefined,
      at: new Date("2026-10-06T18:28:45+03:00"),
    });
    expect(quotes).toContainEqual(
      expect.objectContaining({
        secid: "SU26238RMFS4",
        price: 50.551,
        priceUnit: "percent_of_face",
        accruedInterest: 24.51,
      }),
    );
  });

  it("serves repeated quotes from cache until the TTL passes", async () => {
    let now = 0;
    const { provider, calls } = setup(() => now);

    await provider.getQuotes([sber]);
    await provider.getQuotes([sber]);
    expect(calls).toHaveLength(1);

    now += 61_000;
    await provider.getQuotes([sber]);
    expect(calls).toHaveLength(2);
  });
});

describe("getCouponSchedule", () => {
  it("returns every coupon with date, amount and rate", async () => {
    const { provider } = setup();

    const coupons = await provider.getCouponSchedule("SU26238RMFS4");

    expect(coupons).toHaveLength(40);
    expect(coupons[0]).toEqual({ date: new Date("2021-12-08"), amount: 34.04, rate: 7.1 });
  });
});
