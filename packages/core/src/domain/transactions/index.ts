import { AccountsTable } from "../accounts";
import { CategoriesTable } from "../categories";
import { SecuritiesTable } from "../securities";

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
