import { SecuritiesTable } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

/** @throws {NotFoundError} security does not exist */
export async function archiveSecurity(
  deps: { securityRepo: SecurityRepository },
  securityId: SecuritiesTable["security_id"],
) {
  await deps.securityRepo.archive(securityId);
}
