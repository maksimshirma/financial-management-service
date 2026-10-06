import { HouseholdSecuritiesTable } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

/**
 * Hides the security from the household's list; other households and the
 * reference data are unaffected.
 * @throws {NotFoundError} security is not in the household's list
 */
export async function archiveSecurity(
  deps: { securityRepo: SecurityRepository },
  householdId: HouseholdSecuritiesTable["household_id"],
  securityId: HouseholdSecuritiesTable["security_id"],
) {
  await deps.securityRepo.archiveLink(householdId, securityId);
}
