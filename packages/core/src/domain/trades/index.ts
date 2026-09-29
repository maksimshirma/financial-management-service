export enum TradeType {
  BUY = "buy",
  SELL = "sell",
}

export interface TradesTable {
  trade_id: number;
  date: Date;
  account_id: number;
  security_id: number;
  type: TradeType;
  quantity: number;
  price: number;
  accrued_interest: number;
  fee: number;
}
