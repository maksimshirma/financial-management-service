import { AccountsTable } from "../accounts/index.js";
import { CategoriesTable } from "../categories/index.js";
import { SecuritiesTable } from "../securities/index.js";

export interface TransactionsTable {
  transaction_id: number;
  date: Date;
  account_id: AccountsTable["account_id"];
  amount: number;
  category_id?: CategoriesTable["category_id"];
  is_transfer: boolean;
  to_account_id?: AccountsTable["account_id"];
  to_amount?: number;
  security_id?: SecuritiesTable["security_id"];
  note?: string;
}

export type NewTransaction = Omit<TransactionsTable, "transaction_id">;
