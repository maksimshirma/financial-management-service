import { TradeFilter, TradeRepository } from "../ports";

export async function listTrades(
  deps: { tradeRepo: TradeRepository },
  filter: TradeFilter,
) {
  return deps.tradeRepo.find(filter);
}
