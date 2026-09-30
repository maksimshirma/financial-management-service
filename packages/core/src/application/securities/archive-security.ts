import { SecuritiesTable } from "../../domain";
import { SecurityRepository } from "../ports";

/** @throws {NotFoundError} security does not exist */
export async function archiveSecurity(
  deps: { securityRepo: SecurityRepository },
  securityId: SecuritiesTable["security_id"],
) {
  await deps.securityRepo.archive(securityId);
}
