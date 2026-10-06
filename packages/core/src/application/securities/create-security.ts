import { Currency, HouseholdSecuritiesTable, NewSecurity, SecurityType } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

export interface CreateSecurityInput {
  householdId: HouseholdSecuritiesTable["household_id"];
  ticker: string;
  isin?: string;
  name: string;
  type: SecurityType;
  currency: Currency;
  faceValue?: number;
  couponRate?: number;
  maturityDate?: Date;
}

/**
 * Hand-entered security, private to the household — for instruments that
 * aren't on MOEX. Exchange securities come in through `importSecurity`.
 * @throws {DuplicateEntryError} ticker or isin already taken by this household
 */
export async function createSecurity(
  deps: { securityRepo: SecurityRepository },
  input: CreateSecurityInput,
) {
  const security: NewSecurity = {
    ticker: input.ticker,
    isin: input.isin,
    name: input.name,
    type: input.type,
    currency: input.currency,
    face_value: input.faceValue,
    coupon_rate: input.couponRate,
    maturity_date: input.maturityDate,
    owner_household_id: input.householdId,
  };
  const created = await deps.securityRepo.create(security);
  await deps.securityRepo.link(input.householdId, created.security_id);
  return created;
}
