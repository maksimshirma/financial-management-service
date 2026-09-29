export interface TransactionsTable {
  transaction_id: number;
  date: Date;
  account_id: number;
  amount: number;
  category_id?: number;
  is_transfer: boolean;
  to_account_id?: number;
  to_amount?: number;
  security_id?: number;
  note?: string;
}
