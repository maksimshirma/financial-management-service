import { HouseholdSecuritiesTable } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

export async function listSecurities(
  deps: { securityRepo: SecurityRepository },
  householdId: HouseholdSecuritiesTable["household_id"],
) {
  return deps.securityRepo.listByHousehold(householdId);
}
