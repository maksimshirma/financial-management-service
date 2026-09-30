import { TradesTable } from "../../domain";
import { TradeRepository } from "../ports";

/** @throws {NotFoundError} trade does not exist */
export async function deleteTrade(
  deps: { tradeRepo: TradeRepository },
  tradeId: TradesTable["trade_id"],
) {
  await deps.tradeRepo.delete(tradeId);
}
