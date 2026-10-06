import {
  ForbiddenError,
  HouseholdSecuritiesTable,
  NotFoundError,
  SecuritiesTable,
  SecurityType,
} from "../../domain/index.js";
import { Clock, MarketDataProvider, SecurityRepository } from "../ports/index.js";
import { toSecurityRef } from "./to-security-ref.js";

/**
 * Upcoming coupons of a MOEX bond, from today on.
 * @throws {NotFoundError} security isn't visible to the household
 * @throws {ForbiddenError} security isn't a MOEX bond
 */
export async function getBondSchedule(
  deps: { securityRepo: SecurityRepository; marketData: MarketDataProvider; clock: Clock },
  householdId: HouseholdSecuritiesTable["household_id"],
  securityId: SecuritiesTable["security_id"],
) {
  const security = await deps.securityRepo.findVisible(householdId, securityId);
  if (!security) throw new NotFoundError("Security", securityId);
  if (security.type !== SecurityType.BOND || !toSecurityRef(security)) {
    throw new ForbiddenError(`Coupon schedule is only available for MOEX bonds; ${security.ticker} isn't one`);
  }

  const now = deps.clock.now();
  // a coupon paid today still counts as upcoming
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const coupons = await deps.marketData.getCouponSchedule(security.ticker);
  return coupons.filter((coupon) => coupon.date >= today);
}
