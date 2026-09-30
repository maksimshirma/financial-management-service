import { NewTransaction, TransactionsTable } from "../../domain";
import { Clock, TransactionRepository } from "../ports";

export interface RecordIncomeExpenseInput {
  accountId: TransactionsTable["account_id"];
  amount: number;
  categoryId: NonNullable<TransactionsTable["category_id"]>;
  date?: Date;
  note?: string;
}

/** @throws {NotFoundError} account or category does not exist */
export async function recordIncomeExpense(
  deps: { transactionRepo: TransactionRepository; clock: Clock },
  input: RecordIncomeExpenseInput,
) {
  const transaction: NewTransaction = {
    date: input.date ?? deps.clock.now(),
    account_id: input.accountId,
    amount: input.amount,
    category_id: input.categoryId,
    is_transfer: false,
    to_account_id: undefined,
    to_amount: undefined,
    security_id: undefined,
    note: input.note,
  };
  return deps.transactionRepo.create(transaction);
}
