import { AccountsTable, TradesTable } from "../../domain/index.js";
import { AccountRepository, TradeRepository } from "../ports/index.js";
import { requireOwnTrade } from "./require-own-trade.js";

export interface UpdateTradeInput {
  householdId: AccountsTable["household_id"];
  tradeId: TradesTable["trade_id"];
  date?: Date;
  quantity?: number;
  price?: number;
  accruedInterest?: number;
  fee?: number;
}

/** @throws {NotFoundError} trade does not exist or is on another household's account */
export async function updateTrade(
  deps: { tradeRepo: TradeRepository; accountRepo: AccountRepository },
  input: UpdateTradeInput,
) {
  const existing = await requireOwnTrade(deps, input.householdId, input.tradeId);

  await deps.tradeRepo.update({
    ...existing,
    date: input.date ?? existing.date,
    quantity: input.quantity ?? existing.quantity,
    price: input.price ?? existing.price,
    accrued_interest: input.accruedInterest ?? existing.accrued_interest,
    fee: input.fee ?? existing.fee,
  });
}
