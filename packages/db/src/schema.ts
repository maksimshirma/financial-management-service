import { ColumnType, Generated } from "kysely";
import {
  AccountType,
  CategoryType,
  Currency,
  SecurityType,
  TradeType,
} from "@fms/core";

type Numeric = ColumnType<number, number | string, number | string>;

export interface UserRow {
  user_id: Generated<number>;
  name: string;
}

export interface AccountRow {
  account_id: Generated<number>;
  user_id: number;
  name: string;
  type: AccountType;
  currency: Currency;
  is_archived: boolean;
}

export interface CategoryRow {
  category_id: Generated<number>;
  name: string;
  type: CategoryType;
  is_archived: boolean;
}

export interface SecurityRow {
  security_id: Generated<number>;
  ticker: string;
  isin: string | null;
  name: string;
  type: SecurityType;
  currency: Currency;
  face_value: Numeric | null;
  coupon_rate: Numeric | null;
  maturity_date: Date | null;
  is_archived: boolean;
}

export interface TransactionRow {
  transaction_id: Generated<number>;
  date: Date;
  account_id: number;
  amount: Numeric;
  category_id: number | null;
  is_transfer: boolean;
  to_account_id: number | null;
  to_amount: Numeric | null;
  security_id: number | null;
  note: string | null;
}

export interface TradeRow {
  trade_id: Generated<number>;
  date: Date;
  account_id: number;
  security_id: number;
  type: TradeType;
  quantity: Numeric;
  price: Numeric;
  accrued_interest: Numeric;
  fee: Numeric;
}

export interface Database {
  users: UserRow;
  accounts: AccountRow;
  categories: CategoryRow;
  securities: SecurityRow;
  transactions: TransactionRow;
  trades: TradeRow;
}
