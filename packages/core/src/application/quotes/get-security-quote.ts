import {
  ForbiddenError,
  HouseholdSecuritiesTable,
  NotFoundError,
  SecuritiesTable,
} from "../../domain/index.js";
import { MarketDataProvider, SecurityRepository } from "../ports/index.js";
import { toSecurityRef } from "../securities/to-security-ref.js";

/**
 * Current exchange price (delayed up to 15 minutes); bonds come as a percent
 * of face value plus accrued interest.
 * @throws {NotFoundError} security isn't visible to the household, or the exchange has no price
 * @throws {ForbiddenError} security isn't traded on MOEX (hand-entered)
 */
export async function getSecurityQuote(
  deps: { securityRepo: SecurityRepository; marketData: MarketDataProvider },
  householdId: HouseholdSecuritiesTable["household_id"],
  securityId: SecuritiesTable["security_id"],
) {
  const security = await deps.securityRepo.findVisible(householdId, securityId);
  if (!security) throw new NotFoundError("Security", securityId);

  const ref = toSecurityRef(security);
  if (!ref) {
    throw new ForbiddenError(`Quotes are only available for MOEX securities; ${security.ticker} isn't one`);
  }

  const [quote] = await deps.marketData.getQuotes([ref]);
  if (!quote) throw new NotFoundError("Quote", security.ticker);
  return quote;
}
