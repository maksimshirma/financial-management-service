import {
  DuplicateEntryError,
  HouseholdSecuritiesTable,
  NewSecurity,
  NotFoundError,
  SecuritiesTable,
} from "../../domain/index.js";

type HouseholdId = HouseholdSecuritiesTable["household_id"];
type SecurityId = SecuritiesTable["security_id"];

export interface SecurityRepository {
  findById(securityId: SecurityId): Promise<SecuritiesTable | null>;
  /** null unless the security is an exchange one or owned by the household */
  findVisible(householdId: HouseholdId, securityId: SecurityId): Promise<SecuritiesTable | null>;
  /** among securities visible to the household; an exchange one wins a ticker clash */
  findByTicker(householdId: HouseholdId, ticker: SecuritiesTable["ticker"]): Promise<SecuritiesTable | null>;
  /** the household's non-archived list */
  listByHousehold(householdId: HouseholdId): Promise<SecuritiesTable[]>;
  listArchivedByHousehold(householdId: HouseholdId): Promise<SecuritiesTable[]>;
  /** @throws {DuplicateEntryError} ticker or isin already taken in the same scope */
  create(security: NewSecurity): Promise<SecuritiesTable>;
  /**
   * @throws {NotFoundError} security does not exist
   * @throws {DuplicateEntryError} ticker or isin already taken in the same scope
   */
  update(security: SecuritiesTable): Promise<void>;
  /**
   * Insert an exchange security, or refresh the reference fields of the one
   * with the same ticker.
   * @throws {DuplicateEntryError} isin belongs to another exchange security
   */
  upsertExchange(security: NewSecurity): Promise<SecuritiesTable>;
  /** Add the security to the household's list; un-archives it if already there. */
  link(householdId: HouseholdId, securityId: SecurityId): Promise<void>;
  /** @throws {NotFoundError} security is not in the household's list */
  archiveLink(householdId: HouseholdId, securityId: SecurityId): Promise<void>;
}
