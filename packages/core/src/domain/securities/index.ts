import { Currency } from "../shared";

export enum SecurityType {
  STOCK = "stock",
  BOND = "bond",
  FUND = "fund",
}

export interface SecuritiesTable {
  security_id: number;
  ticker: string;
  isin?: string;
  name: string;
  type: SecurityType;
  currency: Currency;
  face_value?: number;
  coupon_rate?: number;
  maturity_date?: Date;
}
