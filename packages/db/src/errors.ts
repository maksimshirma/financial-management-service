import { DuplicateEntryError, NotFoundError } from "@fms/core";
import { DatabaseError } from "pg";

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

/** @throws {DuplicateEntryError} err is a unique-constraint violation */
/** @throws {NotFoundError} err is a foreign-key violation (referenced row doesn't exist) */
export function mapPgError(err: unknown, entity: string): never {
  if (err instanceof DatabaseError) {
    if (err.code === UNIQUE_VIOLATION) {
      throw new DuplicateEntryError(
        entity,
        err.constraint ?? "unknown",
        err.detail ?? "unknown",
      );
    }
    if (err.code === FOREIGN_KEY_VIOLATION) {
      throw new NotFoundError(entity, err.detail ?? "referenced row");
    }
  }
  throw err;
}
