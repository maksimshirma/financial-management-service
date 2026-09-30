import { NewTrade, TradesTable, TradeType } from "../../domain";
import { Clock, TradeRepository } from "../ports";

export interface BuySecurityInput {
  accountId: TradesTable["account_id"];
  securityId: TradesTable["security_id"];
  quantity: number;
  price: number;
  accruedInterest?: number;
  fee?: number;
  date?: Date;
}

/** @throws {NotFoundError} account or security does not exist */
export async function buySecurity(
  deps: { tradeRepo: TradeRepository; clock: Clock },
  input: BuySecurityInput,
) {
  const trade: NewTrade = {
    date: input.date ?? deps.clock.now(),
    account_id: input.accountId,
    security_id: input.securityId,
    type: TradeType.BUY,
    quantity: input.quantity,
    price: input.price,
    accrued_interest: input.accruedInterest ?? 0,
    fee: input.fee ?? 0,
  };
  return deps.tradeRepo.create(trade);
}
