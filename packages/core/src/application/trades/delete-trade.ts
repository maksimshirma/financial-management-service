import { TradesTable } from "../../domain/index.js";
import { TradeRepository } from "../ports/index.js";

/** @throws {NotFoundError} trade does not exist */
export async function deleteTrade(
  deps: { tradeRepo: TradeRepository },
  tradeId: TradesTable["trade_id"],
) {
  await deps.tradeRepo.delete(tradeId);
}
