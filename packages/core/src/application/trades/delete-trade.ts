import { AccountsTable, TradesTable } from "../../domain/index.js";
import { AccountRepository, TradeRepository } from "../ports/index.js";
import { requireOwnTrade } from "./require-own-trade.js";

/** @throws {NotFoundError} trade does not exist or is on another household's account */
export async function deleteTrade(
  deps: { tradeRepo: TradeRepository; accountRepo: AccountRepository },
  householdId: AccountsTable["household_id"],
  tradeId: TradesTable["trade_id"],
) {
  await requireOwnTrade(deps, householdId, tradeId);
  await deps.tradeRepo.delete(tradeId);
}
