import { SecuritiesTable } from "../../domain";
import { SecurityRepository } from "../ports";

export async function findSecurityByTicker(
  deps: { securityRepo: SecurityRepository },
  ticker: SecuritiesTable["ticker"],
) {
  return deps.securityRepo.findByTicker(ticker);
}
