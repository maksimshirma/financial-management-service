import { ColumnType, Generated } from "kysely";
import {
  AccountType,
  CategoryType,
  Currency,
  SecurityType,
  TradeType,
} from "@fms/core";

type Numeric = ColumnType<number, number | string, number | string>;

export interface AccountRow {
  account_id: Generated<number>;
  household_id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  is_archived: boolean;
}

export interface CategoryRow {
  category_id: Generated<number>;
  household_id: string;
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
  owner_household_id: string | null;
  board_id: string | null;
  market: string | null;
  synced_at: Date | null;
}

export interface HouseholdSecurityRow {
  household_id: string;
  security_id: number;
  is_archived: Generated<boolean>;
  added_at: Generated<Date>;
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
  accounts: AccountRow;
  categories: CategoryRow;
  securities: SecurityRow;
  household_securities: HouseholdSecurityRow;
  transactions: TransactionRow;
  trades: TradeRow;
}
