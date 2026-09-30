import { NotFoundError, TransactionsTable } from "../../domain";
import { TransactionRepository } from "../ports";

export interface UpdateTransactionInput {
  transactionId: TransactionsTable["transaction_id"];
  date?: Date;
  amount?: number;
  categoryId?: TransactionsTable["category_id"];
  toAccountId?: TransactionsTable["to_account_id"];
  toAmount?: TransactionsTable["to_amount"];
  securityId?: TransactionsTable["security_id"];
  note?: TransactionsTable["note"];
}

/** @throws {NotFoundError} transaction, or a referenced account/category/security, does not exist */
export async function updateTransaction(
  deps: { transactionRepo: TransactionRepository },
  input: UpdateTransactionInput,
) {
  const existing = await deps.transactionRepo.findById(input.transactionId);
  if (!existing) throw new NotFoundError("Transaction", input.transactionId);

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
