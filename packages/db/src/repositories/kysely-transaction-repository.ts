import { Kysely, Selectable } from "kysely";
import {
  NewTransaction,
  NotFoundError,
  TransactionFilter,
  TransactionRepository,
  TransactionsTable,
} from "@fms/core";
import { Database, TransactionRow } from "../schema.js";
import { mapPgError } from "../errors.js";

// domain fields are optional (absent = undefined); the columns are nullable
// (absent = null) — bridge the two directions here, once.
function toDomain(row: Selectable<TransactionRow>): TransactionsTable {
  return {
    transaction_id: row.transaction_id,
    date: row.date,
    account_id: row.account_id,
    amount: row.amount,
    category_id: row.category_id ?? undefined,
    is_transfer: row.is_transfer,
    to_account_id: row.to_account_id ?? undefined,
    to_amount: row.to_amount ?? undefined,
    security_id: row.security_id ?? undefined,
    note: row.note ?? undefined,
  };
}

function toRow(transaction: NewTransaction | TransactionsTable) {
  return {
    date: transaction.date,
    account_id: transaction.account_id,
    amount: transaction.amount,
    category_id: transaction.category_id ?? null,
    is_transfer: transaction.is_transfer,
    to_account_id: transaction.to_account_id ?? null,
    to_amount: transaction.to_amount ?? null,
    security_id: transaction.security_id ?? null,
    note: transaction.note ?? null,
  };
}

export class KyselyTransactionRepository implements TransactionRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(
    transactionId: TransactionsTable["transaction_id"],
  ): Promise<TransactionsTable | null> {
    const row = await this.db
      .selectFrom("transactions")
      .selectAll()
      .where("transaction_id", "=", transactionId)
      .executeTakeFirst();
    return row ? toDomain(row) : null;
  }

  async find(filter: TransactionFilter): Promise<TransactionsTable[]> {
    let query = this.db.selectFrom("transactions").selectAll();

    if (filter.householdId !== undefined) {
      const householdId = filter.householdId;
      query = query.where("account_id", "in", (qb) =>
        qb
          .selectFrom("accounts")
          .select("account_id")
          .where("household_id", "=", householdId),
      );
    }
    if (filter.accountId !== undefined) {
      query = query.where("account_id", "=", filter.accountId);
    }
    if (filter.from !== undefined) {
      query = query.where("date", ">=", filter.from);
    }
    if (filter.to !== undefined) {
      query = query.where("date", "<=", filter.to);
    }

    const rows = await query.execute();
    return rows.map(toDomain);
  }

  async create(transaction: NewTransaction): Promise<TransactionsTable> {
    const row = await this.db
      .insertInto("transactions")
      .values(toRow(transaction))
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((err) => mapPgError(err, "Transaction"));
    return toDomain(row);
  }

  async update(transaction: TransactionsTable): Promise<void> {
    const result = await this.db
      .updateTable("transactions")
      .set(toRow(transaction))
      .where("transaction_id", "=", transaction.transaction_id)
      .executeTakeFirst()
      .catch((err) => mapPgError(err, "Transaction"));

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Transaction", transaction.transaction_id);
    }
  }

  async delete(
    transactionId: TransactionsTable["transaction_id"],
  ): Promise<void> {
    const result = await this.db
      .deleteFrom("transactions")
      .where("transaction_id", "=", transactionId)
      .executeTakeFirst();

    if (result.numDeletedRows === 0n) {
      throw new NotFoundError("Transaction", transactionId);
    }
  }
}
