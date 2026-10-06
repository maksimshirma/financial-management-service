import { Currency } from "../shared/index.js";

export enum AccountType {
  CASH = "cash",
  CARD = "card",
  DEPOSIT = "deposit",
  CREDIT = "credit",
  BROKER = "broker",
}

export interface AccountsTable {
  account_id: number;
  household_id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  is_archived: boolean;
}

export type NewAccount = Omit<AccountsTable, "account_id">;
