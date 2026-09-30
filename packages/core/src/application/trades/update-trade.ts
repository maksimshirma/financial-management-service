import { NotFoundError, TradesTable } from "../../domain";
import { TradeRepository } from "../ports";

export interface UpdateTradeInput {
  tradeId: TradesTable["trade_id"];
  date?: Date;
  quantity?: number;
  price?: number;
  accruedInterest?: number;
  fee?: number;
}

/** @throws {NotFoundError} trade, or a referenced account/security, does not exist */
export async function updateTrade(
  deps: { tradeRepo: TradeRepository },
  input: UpdateTradeInput,
) {
  const existing = await deps.tradeRepo.findById(input.tradeId);
  if (!existing) throw new NotFoundError("Trade", input.tradeId);

  await deps.tradeRepo.update({
    ...existing,
    date: input.date ?? existing.date,
    quantity: input.quantity ?? existing.quantity,
    price: input.price ?? existing.price,
    accrued_interest: input.accruedInterest ?? existing.accrued_interest,
    fee: input.fee ?? existing.fee,
  });
}
