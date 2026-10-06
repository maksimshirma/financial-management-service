import {
  CouponPayment,
  MarketDataProvider,
  Quote,
  SecurityCandidate,
  SecurityRef,
  SecuritySpec,
  SecurityType,
} from "@fms/core";
import { IssClient, IssClientOptions, parseBlock } from "./iss-client.js";
import {
  toCurrency,
  toDate,
  toNumber,
  toOptionalString,
  toSecurityType,
} from "./mappers.js";
import { TtlCache } from "./ttl-cache.js";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const SEARCH_LIMIT = 20;
const BONDS_MARKET = "bonds";

export interface MoexMarketDataProviderOptions extends IssClientOptions {
  quoteTtlMs?: number;
  referenceTtlMs?: number;
  now?: () => number;
}

/** `MarketDataProvider` backed by MOEX ISS (anonymous access, quotes delayed 15 min). */
export class MoexMarketDataProvider implements MarketDataProvider {
  private readonly iss: IssClient;
  private readonly quotes: TtlCache<Quote | null>;
  private readonly specs: TtlCache<SecuritySpec | null>;
  private readonly coupons: TtlCache<CouponPayment[]>;

  constructor(options: MoexMarketDataProviderOptions = {}) {
    this.iss = new IssClient(options);
    // ISS docs: reference data doesn't change during a trading day — fetch it once a day
    this.quotes = new TtlCache(options.quoteTtlMs ?? MINUTE, options.now);
    this.specs = new TtlCache(options.referenceTtlMs ?? DAY, options.now);
    this.coupons = new TtlCache(options.referenceTtlMs ?? DAY, options.now);
  }

  async search(query: string): Promise<SecurityCandidate[]> {
    const json = await this.iss.get("/securities", {
      q: query,
      is_trading: 1,
      limit: SEARCH_LIMIT,
      "iss.only": "securities",
      "securities.columns": "secid,shortname,isin,type,primary_boardid",
    });

    return parseBlock(json, "securities").flatMap((row) => {
      const type = toSecurityType(row.type);
      if (!type) return [];
      return [
        {
          secid: String(row.secid),
          isin: toOptionalString(row.isin),
          name: String(row.shortname),
          type,
          boardId: toOptionalString(row.primary_boardid),
        },
      ];
    });
  }

  getSpec(secid: string): Promise<SecuritySpec | null> {
    return this.specs.getOrLoad(secid, () => this.loadSpec(secid));
  }

  private async loadSpec(secid: string): Promise<SecuritySpec | null> {
    const json = await this.iss.get(`/securities/${encodeURIComponent(secid)}`, {
      "iss.only": "description,boards",
      "description.columns": "name,value",
      "boards.columns": "boardid,market,engine,is_primary,currencyid",
    });

    const description = new Map(
      parseBlock(json, "description").map((row) => [String(row.name), row.value]),
    );
    const board = parseBlock(json, "boards").find(
      (row) => row.is_primary === 1 && row.engine === "stock",
    );
    const type = toSecurityType(description.get("TYPE"));
    const currency = toCurrency(board?.currencyid ?? description.get("FACEUNIT"));
    if (!board || !type || !currency) return null;

    const isBond = type === SecurityType.BOND;
    return {
      secid: String(description.get("SECID")),
      isin: toOptionalString(description.get("ISIN")),
      name: String(description.get("SHORTNAME") ?? description.get("NAME")),
      type,
      currency,
      boardId: String(board.boardid),
      market: String(board.market),
      faceValue: isBond ? toNumber(description.get("FACEVALUE")) : undefined,
      couponRate: isBond ? toNumber(description.get("COUPONPERCENT")) : undefined,
      maturityDate: isBond ? toDate(description.get("MATDATE")) : undefined,
    };
  }

  async getQuotes(securities: SecurityRef[]): Promise<Quote[]> {
    const result: Quote[] = [];
    const missing = new Map<string, SecurityRef[]>();

    for (const ref of securities) {
      const cached = this.quotes.get(quoteKey(ref));
      if (cached !== undefined) {
        if (cached) result.push(cached);
        continue;
      }
      const group = `${ref.market}/${ref.boardId}`;
      missing.set(group, [...(missing.get(group) ?? []), ref]);
    }

    // one request per board, all of its securities at once
    for (const refs of missing.values()) {
      const loaded = await this.loadBoardQuotes(refs);
      for (const ref of refs) {
        const quote = loaded.get(ref.secid) ?? null;
        this.quotes.set(quoteKey(ref), quote);
        if (quote) result.push(quote);
      }
    }
    return result;
  }

  private async loadBoardQuotes(refs: SecurityRef[]): Promise<Map<string, Quote>> {
    const { market, boardId } = refs[0];
    const isBonds = market === BONDS_MARKET;
    const json = await this.iss.get(
      `/engines/stock/markets/${market}/boards/${boardId}/securities`,
      {
        securities: refs.map((ref) => ref.secid).join(","),
        "iss.only": "securities,marketdata",
        "securities.columns": isBonds ? "SECID,PREVPRICE,ACCRUEDINT" : "SECID,PREVPRICE",
        "marketdata.columns": "SECID,LAST,MARKETPRICE,SYSTIME",
      },
    );

    const marketdata = new Map(
      parseBlock(json, "marketdata").map((row) => [String(row.SECID), row]),
    );
    const quotes = new Map<string, Quote>();
    for (const row of parseBlock(json, "securities")) {
      const secid = String(row.SECID);
      const live = marketdata.get(secid);
      // LAST is empty outside trading hours — fall back to the market/previous price
      const price =
        toNumber(live?.LAST) ?? toNumber(live?.MARKETPRICE) ?? toNumber(row.PREVPRICE);
      if (price === undefined) continue;

      quotes.set(secid, {
        secid,
        price,
        priceUnit: isBonds ? "percent_of_face" : "currency",
        accruedInterest: isBonds ? toNumber(row.ACCRUEDINT) : undefined,
        at: toMoscowTime(live?.SYSTIME) ?? new Date(),
      });
    }
    return quotes;
  }

  getCouponSchedule(secid: string): Promise<CouponPayment[]> {
    return this.coupons.getOrLoad(secid, async () => {
      const rows = await this.iss.getAll(
        `/statistics/engines/stock/markets/bonds/bondization/${encodeURIComponent(secid)}`,
        "coupons",
        { limit: 100, "coupons.columns": "coupondate,value,valueprc" },
      );
      return rows.flatMap((row) => {
        const date = toDate(row.coupondate);
        if (!date) return [];
        return [{ date, amount: toNumber(row.value), rate: toNumber(row.valueprc) }];
      });
    });
  }
}

function quoteKey(ref: SecurityRef) {
  return `${ref.market}/${ref.boardId}/${ref.secid}`;
}

// SYSTIME is exchange (Moscow, UTC+3) wall-clock time: "2026-10-06 18:26:56"
function toMoscowTime(value: unknown): Date | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  const date = new Date(`${value.replace(" ", "T")}+03:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
