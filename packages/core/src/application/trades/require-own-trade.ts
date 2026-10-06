import { AccountsTable, NotFoundError, TradesTable } from "../../domain/index.js";
import { AccountRepository, TradeRepository } from "../ports/index.js";

/** @throws {NotFoundError} trade does not exist or is on another household's account */
export async function requireOwnTrade(
  deps: { tradeRepo: TradeRepository; accountRepo: AccountRepository },
  householdId: AccountsTable["household_id"],
  tradeId: TradesTable["trade_id"],
): Promise<TradesTable> {
  const trade = await deps.tradeRepo.findById(tradeId);
  const account = trade && (await deps.accountRepo.findById(trade.account_id));
  if (!trade || !account || account.household_id !== householdId) {
    throw new NotFoundError("Trade", tradeId);
  }
  return trade;
}
