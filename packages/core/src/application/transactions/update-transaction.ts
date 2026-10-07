import { AccountsTable, TransactionsTable } from "../../domain/index.js";
import {
  AccountRepository,
  CategoryRepository,
  SecurityRepository,
  TransactionRepository,
} from "../ports/index.js";
import {
  requireOwnAccount,
  requireOwnCategory,
  requireVisibleSecurity,
} from "../households/household-access.js";
import { requireOwnTransaction } from "./require-own-transaction.js";

export interface UpdateTransactionInput {
  householdId: AccountsTable["household_id"];
  transactionId: TransactionsTable["transaction_id"];
  date?: Date;
  amount?: number;
  categoryId?: TransactionsTable["category_id"];
  toAccountId?: TransactionsTable["to_account_id"];
  toAmount?: TransactionsTable["to_amount"];
  securityId?: TransactionsTable["security_id"];
  note?: TransactionsTable["note"];
}

/**
 * @throws {NotFoundError} transaction isn't on the household's account, or a
 * newly referenced category/account/security doesn't exist or isn't the household's
 */
export async function updateTransaction(
  deps: {
    transactionRepo: TransactionRepository;
    accountRepo: AccountRepository;
    categoryRepo: CategoryRepository;
    securityRepo: SecurityRepository;
  },
  input: UpdateTransactionInput,
) {
  const { householdId } = input;
  const existing = await requireOwnTransaction(deps, householdId, input.transactionId);
  if (input.categoryId != null) {
    await requireOwnCategory(deps.categoryRepo, householdId, input.categoryId);
  }
  if (input.toAccountId != null) {
    await requireOwnAccount(deps.accountRepo, householdId, input.toAccountId);
  }
  if (input.securityId != null) {
    await requireVisibleSecurity(deps.securityRepo, householdId, input.securityId);
  }

  await deps.transactionRepo.update({
    ...existing,
    date: input.date ?? existing.date,
    amount: input.amount ?? existing.amount,
    category_id: input.categoryId ?? existing.category_id,
    to_account_id: input.toAccountId ?? existing.to_account_id,
    to_amount: input.toAmount ?? existing.to_amount,
    security_id: input.securityId ?? existing.security_id,
    note: input.note ?? existing.note,
  });
}
