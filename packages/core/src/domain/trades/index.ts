import { AccountsTable } from "../accounts";
import { SecuritiesTable } from "../securities";

export enum TradeType {
  BUY = "buy",
  SELL = "sell",
}

export interface TradesTable {
  trade_id: number;
  date: Date;
  account_id: AccountsTable["account_id"];
  security_id: SecuritiesTable["security_id"];
  type: TradeType;
  quantity: number;
  price: number;
  accrued_interest: number;
  fee: number;
}
