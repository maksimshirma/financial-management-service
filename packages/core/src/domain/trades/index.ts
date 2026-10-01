import { AccountsTable } from "../accounts/index.js";
import { SecuritiesTable } from "../securities/index.js";

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

export type NewTrade = Omit<TradesTable, "trade_id">;
