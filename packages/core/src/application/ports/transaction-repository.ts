import {
  AccountsTable,
  NewTransaction,
  NotFoundError,
  TransactionsTable,
} from "../../domain/index.js";

export interface TransactionFilter {
  /** transactions on any account of this household */
  householdId?: AccountsTable["household_id"];
  accountId?: TransactionsTable["account_id"];
  from?: Date;
  to?: Date;
}

export interface TransactionRepository {
  findById(
    transactionId: TransactionsTable["transaction_id"],
  ): Promise<TransactionsTable | null>;
  /** filters combine with AND; omitted fields are unconstrained */
  find(filter: TransactionFilter): Promise<TransactionsTable[]>;
  /** @throws {NotFoundError} referenced account, category, to-account, or security does not exist */
  create(transaction: NewTransaction): Promise<TransactionsTable>;
  /** @throws {NotFoundError} transaction, or a referenced account/category/security, does not exist */
  update(transaction: TransactionsTable): Promise<void>;
  /** @throws {NotFoundError} transaction does not exist */
  delete(transactionId: TransactionsTable["transaction_id"]): Promise<void>;
}
