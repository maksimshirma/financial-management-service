import { Currency, NewSecurity, SecurityType } from "../../domain";
import { SecurityRepository } from "../ports";

export interface CreateSecurityInput {
  ticker: string;
  isin?: string;
  name: string;
  type: SecurityType;
  currency: Currency;
  faceValue?: number;
  couponRate?: number;
  maturityDate?: Date;
}

/** @throws {DuplicateEntryError} ticker or isin already taken */
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
    is_archived: false,
  };
  return deps.securityRepo.create(security);
}
