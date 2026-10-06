import { HouseholdSecuritiesTable, SecuritiesTable } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

export async function findSecurityByTicker(
  deps: { securityRepo: SecurityRepository },
  householdId: HouseholdSecuritiesTable["household_id"],
  ticker: SecuritiesTable["ticker"],
) {
  return deps.securityRepo.findByTicker(householdId, ticker);
}
