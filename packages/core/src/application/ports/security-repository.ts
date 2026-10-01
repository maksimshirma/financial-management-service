import {
  DuplicateEntryError,
  NewSecurity,
  NotFoundError,
  SecuritiesTable,
} from "../../domain/index.js";

export interface SecurityRepository {
  findById(
    securityId: SecuritiesTable["security_id"],
  ): Promise<SecuritiesTable | null>;
  findByTicker(
    ticker: SecuritiesTable["ticker"],
  ): Promise<SecuritiesTable | null>;
  findByIsin(isin: SecuritiesTable["isin"]): Promise<SecuritiesTable | null>;
  listAll(): Promise<SecuritiesTable[]>;
  listArchived(): Promise<SecuritiesTable[]>;
  /** @throws {DuplicateEntryError} ticker or isin already taken */
  create(security: NewSecurity): Promise<SecuritiesTable>;
  /**
   * @throws {NotFoundError} security does not exist
   * @throws {DuplicateEntryError} ticker or isin already taken
   */
  update(security: SecuritiesTable): Promise<void>;
  /** @throws {NotFoundError} security does not exist */
  archive(securityId: SecuritiesTable["security_id"]): Promise<void>;
}
