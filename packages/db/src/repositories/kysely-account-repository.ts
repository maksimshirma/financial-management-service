import { Kysely } from "kysely";
import {
  AccountRepository,
  AccountsTable,
  NewAccount,
  NotFoundError,
} from "@fms/core";
import { Database } from "../schema.js";
import { mapPgError } from "../errors.js";

export class KyselyAccountRepository implements AccountRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(
    accountId: AccountsTable["account_id"],
  ): Promise<AccountsTable | null> {
    const row = await this.db
      .selectFrom("accounts")
      .selectAll()
      .where("account_id", "=", accountId)
      .executeTakeFirst();
    return row ?? null;
  }

  async findByName(
    householdId: AccountsTable["household_id"],
    name: string,
  ): Promise<AccountsTable | null> {
    const row = await this.db
      .selectFrom("accounts")
      .selectAll()
      .where("household_id", "=", householdId)
      .where("name", "=", name)
      .executeTakeFirst();
    return row ?? null;
  }

  async findAllByHousehold(
    householdId: AccountsTable["household_id"],
  ): Promise<AccountsTable[]> {
    return this.db
      .selectFrom("accounts")
      .selectAll()
      .where("household_id", "=", householdId)
      .where("is_archived", "=", false)
      .execute();
  }

  async findArchivedByHousehold(
    householdId: AccountsTable["household_id"],
  ): Promise<AccountsTable[]> {
    return this.db
      .selectFrom("accounts")
      .selectAll()
      .where("household_id", "=", householdId)
      .where("is_archived", "=", true)
      .execute();
  }

  async create(account: NewAccount): Promise<AccountsTable> {
    return this.db
      .insertInto("accounts")
      .values(account)
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((err) => mapPgError(err, "Account"));
  }

  async update(account: AccountsTable): Promise<void> {
    const { account_id, ...fields } = account;
    const result = await this.db
      .updateTable("accounts")
      .set(fields)
      .where("account_id", "=", account_id)
      .executeTakeFirst()
      .catch((err) => mapPgError(err, "Account"));

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Account", account_id);
    }
  }

  async archive(accountId: AccountsTable["account_id"]): Promise<void> {
    const result = await this.db
      .updateTable("accounts")
      .set({ is_archived: true })
      .where("account_id", "=", accountId)
      .executeTakeFirst();

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Account", accountId);
    }
  }
}
