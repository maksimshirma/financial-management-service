import { Currency } from "../shared";

export enum AccountType {
  CASH = "cash",
  CARD = "card",
  DEPOSIT = "deposit",
  CREDIT = "credit",
  BROKER = "broker",
}

export interface AccountsTable {
  account_id: number;
  user_id: number;
  name: string;
  type: AccountType;
  currency: Currency;
  is_archived: boolean;
}

export type NewAccount = Omit<AccountsTable, "account_id">;
