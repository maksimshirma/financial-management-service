import {
  computePositions,
  Currency,
  HouseholdSecuritiesTable,
  SecuritiesTable,
  SecurityType,
} from "../../domain/index.js";
import {
  MarketDataProvider,
  Quote,
  SecurityRepository,
  SecurityRef,
  TradeRepository,
} from "../ports/index.js";
import { toSecurityRef } from "../securities/to-security-ref.js";

export interface PositionValue {
  securityId: SecuritiesTable["security_id"];
  ticker: string;
  name: string;
  type: SecurityType;
  currency: Currency;
  quantity: number;
  price?: number;
  priceUnit?: Quote["priceUnit"];
  accruedInterest?: number;
  /** absent when the position couldn't be priced */
  value?: number;
  quotedAt?: Date;
}

export interface PortfolioValue {
  positions: PositionValue[];
  /** sum of priced positions per currency */
  totals: Partial<Record<Currency, number>>;
  /** tickers of open positions left out of the totals */
  unpriced: string[];
  /** set when the exchange couldn't be reached — every position is then unpriced */
  quotesError?: string;
}

/**
 * Open positions across all of the household's accounts, valued at current
 * exchange prices. Never fails because of the exchange: unpriced positions
 * are reported separately.
 */
export async function getPortfolioValue(
  deps: {
    tradeRepo: TradeRepository;
    securityRepo: SecurityRepository;
    marketData: MarketDataProvider;
  },
  householdId: HouseholdSecuritiesTable["household_id"],
): Promise<PortfolioValue> {
  const trades = await deps.tradeRepo.find({ householdId });
  const positions = computePositions(trades);

  const securities = new Map<number, SecuritiesTable>();
  for (const { security_id } of positions) {
    const security = await deps.securityRepo.findById(security_id);
    if (security) securities.set(security_id, security);
  }

  const refs = [...securities.values()]
    .map(toSecurityRef)
    .filter((ref): ref is SecurityRef => ref !== null);
  let quotes = new Map<string, Quote>();
  let quotesError: string | undefined;
  if (refs.length > 0) {
    try {
      quotes = new Map((await deps.marketData.getQuotes(refs)).map((q) => [q.secid, q]));
    } catch (err) {
      quotesError = err instanceof Error ? err.message : String(err);
    }
  }

  const result: PortfolioValue = { positions: [], totals: {}, unpriced: [], quotesError };
  for (const { security_id, quantity } of positions) {
    const security = securities.get(security_id);
    if (!security) continue;

    const quote = toSecurityRef(security) ? quotes.get(security.ticker) : undefined;
    const value = quote ? valueOf(security, quantity, quote) : undefined;
    result.positions.push({
      securityId: security_id,
      ticker: security.ticker,
      name: security.name,
      type: security.type,
      currency: security.currency,
      quantity,
      price: quote?.price,
      priceUnit: quote?.priceUnit,
      accruedInterest: quote?.accruedInterest,
      value,
      quotedAt: quote?.at,
    });

    if (value === undefined) {
      result.unpriced.push(security.ticker);
    } else {
      result.totals[security.currency] = round2((result.totals[security.currency] ?? 0) + value);
    }
  }
  return result;
}

function valueOf(security: SecuritiesTable, quantity: number, quote: Quote): number | undefined {
  if (quote.priceUnit === "currency") return round2(quantity * quote.price);
  // bonds: price is a percent of face value, plus accrued coupon per bond
  if (security.face_value === undefined) return undefined;
  const perBond = (quote.price / 100) * security.face_value + (quote.accruedInterest ?? 0);
  return round2(quantity * perBond);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
