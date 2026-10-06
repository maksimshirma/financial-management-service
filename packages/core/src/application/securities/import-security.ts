import { HouseholdSecuritiesTable, NewSecurity, NotFoundError } from "../../domain/index.js";
import { Clock, MarketDataProvider, SecurityRepository } from "../ports/index.js";

export interface ImportSecurityInput {
  householdId: HouseholdSecuritiesTable["household_id"];
  /** MOEX security code, e.g. from `searchSecurities` */
  secid: string;
}

/**
 * Pulls the security's reference data from the exchange into the shared
 * reference (or refreshes it) and adds it to the household's list. Idempotent.
 * @throws {NotFoundError} exchange doesn't know the code, or its type/currency is unsupported
 */
export async function importSecurity(
  deps: { securityRepo: SecurityRepository; marketData: MarketDataProvider; clock: Clock },
  input: ImportSecurityInput,
) {
  const spec = await deps.marketData.getSpec(input.secid);
  if (!spec) throw new NotFoundError("Exchange security", input.secid);

  const security: NewSecurity = {
    ticker: spec.secid,
    isin: spec.isin,
    name: spec.name,
    type: spec.type,
    currency: spec.currency,
    face_value: spec.faceValue,
    coupon_rate: spec.couponRate,
    maturity_date: spec.maturityDate,
    board_id: spec.boardId,
    market: spec.market,
    synced_at: deps.clock.now(),
  };
  const saved = await deps.securityRepo.upsertExchange(security);
  await deps.securityRepo.link(input.householdId, saved.security_id);
  return saved;
}
