import { TradeFilter, TradeRepository } from "../ports/index.js";

export async function listTrades(
  deps: { tradeRepo: TradeRepository },
  filter: TradeFilter,
) {
  return deps.tradeRepo.find(filter);
}
