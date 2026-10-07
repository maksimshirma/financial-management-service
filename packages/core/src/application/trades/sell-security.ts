import { AccountsTable, NewTrade, TradesTable, TradeType } from "../../domain/index.js";
import { Clock } from "../ports/index.js";
import { RecordTradeDeps, recordTrade } from "./record-trade.js";

export interface SellSecurityInput {
  householdId: AccountsTable["household_id"];
  accountId: TradesTable["account_id"];
  securityId: TradesTable["security_id"];
  quantity: number;
  price: number;
  accruedInterest?: number;
  fee?: number;
  date?: Date;
}

/** @throws {NotFoundError} account isn't the household's, or security isn't visible to it */
export async function sellSecurity(
  deps: RecordTradeDeps & { clock: Clock },
  input: SellSecurityInput,
) {
  const trade: NewTrade = {
    date: input.date ?? deps.clock.now(),
    account_id: input.accountId,
    security_id: input.securityId,
    type: TradeType.SELL,
    quantity: input.quantity,
    price: input.price,
    accrued_interest: input.accruedInterest ?? 0,
    fee: input.fee ?? 0,
  };
  return recordTrade(deps, input.householdId, trade);
}
