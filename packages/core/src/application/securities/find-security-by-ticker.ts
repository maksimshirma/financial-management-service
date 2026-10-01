import { SecuritiesTable } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

export async function findSecurityByTicker(
  deps: { securityRepo: SecurityRepository },
  ticker: SecuritiesTable["ticker"],
) {
  return deps.securityRepo.findByTicker(ticker);
}
