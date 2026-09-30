import {
  InvalidTransactionError,
  NewTransaction,
  TransactionsTable,
} from "../../domain";
import { Clock, TransactionRepository } from "../ports";

export interface TransferBetweenAccountsInput {
  accountId: TransactionsTable["account_id"];
  toAccountId: NonNullable<TransactionsTable["to_account_id"]>;
  amount: number;
  toAmount?: number;
  date?: Date;
  note?: string;
}

/**
 * @throws {InvalidTransactionError} accountId and toAccountId are the same
 * @throws {NotFoundError} either account does not exist
 */
export async function transferBetweenAccounts(
  deps: { transactionRepo: TransactionRepository; clock: Clock },
  input: TransferBetweenAccountsInput,
) {
  if (input.accountId === input.toAccountId) {
    throw new InvalidTransactionError(
      "Cannot transfer to the same account",
    );
  }

  const transaction: NewTransaction = {
    date: input.date ?? deps.clock.now(),
    account_id: input.accountId,
    amount: input.amount,
    category_id: undefined,
    is_transfer: true,
    to_account_id: input.toAccountId,
    to_amount: input.toAmount,
    security_id: undefined,
    note: input.note,
  };
  return deps.transactionRepo.create(transaction);
}
