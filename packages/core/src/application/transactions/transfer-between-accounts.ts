import {
  AccountsTable,
  InvalidTransactionError,
  NewTransaction,
  TransactionsTable,
} from "../../domain/index.js";
import { AccountRepository, Clock, TransactionRepository } from "../ports/index.js";
import { requireOwnAccount } from "../households/household-access.js";

export interface TransferBetweenAccountsInput {
  householdId: AccountsTable["household_id"];
  accountId: TransactionsTable["account_id"];
  toAccountId: NonNullable<TransactionsTable["to_account_id"]>;
  amount: number;
  toAmount?: number;
  date?: Date;
  note?: string;
}

/**
 * @throws {InvalidTransactionError} accountId and toAccountId are the same
 * @throws {NotFoundError} either account does not exist or isn't the household's
 */
export async function transferBetweenAccounts(
  deps: { transactionRepo: TransactionRepository; accountRepo: AccountRepository; clock: Clock },
  input: TransferBetweenAccountsInput,
) {
  if (input.accountId === input.toAccountId) {
    throw new InvalidTransactionError(
      "Cannot transfer to the same account",
    );
  }
  // transfers are between the household's own accounts only
  await requireOwnAccount(deps.accountRepo, input.householdId, input.accountId);
  await requireOwnAccount(deps.accountRepo, input.householdId, input.toAccountId);

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
