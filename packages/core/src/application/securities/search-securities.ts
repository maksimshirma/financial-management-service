import { MarketDataProvider } from "../ports/index.js";

/** Searches the exchange (not the local reference) by ticker, ISIN or name. */
export async function searchSecurities(
  deps: { marketData: MarketDataProvider },
  query: string,
) {
  return deps.marketData.search(query);
}
