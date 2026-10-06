import { HouseholdSecuritiesTable } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

export async function listArchivedSecurities(
  deps: { securityRepo: SecurityRepository },
  householdId: HouseholdSecuritiesTable["household_id"],
) {
  return deps.securityRepo.listArchivedByHousehold(householdId);
}
