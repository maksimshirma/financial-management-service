import { AccountsTable, NewTransaction, TransactionsTable } from "../../domain/index.js";
import {
  AccountRepository,
  CategoryRepository,
  Clock,
  TransactionRepository,
} from "../ports/index.js";
import { requireOwnAccount, requireOwnCategory } from "../households/household-access.js";

export interface RecordIncomeExpenseInput {
  householdId: AccountsTable["household_id"];
  accountId: TransactionsTable["account_id"];
  amount: number;
  categoryId: NonNullable<TransactionsTable["category_id"]>;
  date?: Date;
  note?: string;
}

/** @throws {NotFoundError} account or category does not exist or isn't the household's */
export async function recordIncomeExpense(
  deps: {
    transactionRepo: TransactionRepository;
    accountRepo: AccountRepository;
    categoryRepo: CategoryRepository;
    clock: Clock;
  },
  input: RecordIncomeExpenseInput,
) {
  await requireOwnAccount(deps.accountRepo, input.householdId, input.accountId);
  await requireOwnCategory(deps.categoryRepo, input.householdId, input.categoryId);

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
