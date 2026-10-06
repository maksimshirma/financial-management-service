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
    householdId: AccountsTable["household_id"],
    name: string,
  ): Promise<AccountsTable | null>;
  findAllByHousehold(
    householdId: AccountsTable["household_id"],
  ): Promise<AccountsTable[]>;
  findArchivedByHousehold(
    householdId: AccountsTable["household_id"],
  ): Promise<AccountsTable[]>;
  /** @throws {DuplicateEntryError} (household_id, name) already taken */
  create(account: NewAccount): Promise<AccountsTable>;
  /**
   * @throws {NotFoundError} account does not exist
   * @throws {DuplicateEntryError} (household_id, name) already taken
   */
  update(account: AccountsTable): Promise<void>;
  /** @throws {NotFoundError} account does not exist */
  archive(accountId: AccountsTable["account_id"]): Promise<void>;
}
