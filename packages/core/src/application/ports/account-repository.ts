import {
  AccountsTable,
  DuplicateEntryError,
  NewAccount,
  NotFoundError,
} from "../../domain/index.js";

export interface AccountRepository {
  findById(
    accountId: AccountsTable["account_id"],
  ): Promise<AccountsTable | null>;
  findByName(
    userId: AccountsTable["user_id"],
    name: string,
  ): Promise<AccountsTable | null>;
  findAllByUser(userId: AccountsTable["user_id"]): Promise<AccountsTable[]>;
  findArchivedByUser(
    userId: AccountsTable["user_id"],
  ): Promise<AccountsTable[]>;
  /** @throws {DuplicateEntryError} (user_id, name) already taken */
  create(account: NewAccount): Promise<AccountsTable>;
  /**
   * @throws {NotFoundError} account does not exist
   * @throws {DuplicateEntryError} (user_id, name) already taken
   */
  update(account: AccountsTable): Promise<void>;
  /** @throws {NotFoundError} account does not exist */
  archive(accountId: AccountsTable["account_id"]): Promise<void>;
}
