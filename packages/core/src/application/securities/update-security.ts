import {
  ForbiddenError,
  HouseholdSecuritiesTable,
  isExchangeSecurity,
  NotFoundError,
  SecuritiesTable,
} from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

export interface UpdateSecurityInput {
  householdId: HouseholdSecuritiesTable["household_id"];
  securityId: SecuritiesTable["security_id"];
  name?: string;
  faceValue?: number;
  couponRate?: number;
  maturityDate?: Date;
}

/**
 * @throws {NotFoundError} security does not exist or isn't visible to the household
 * @throws {ForbiddenError} security comes from the exchange — only sync changes it
 */
export async function updateSecurity(
  deps: { securityRepo: SecurityRepository },
  input: UpdateSecurityInput,
) {
  const existing = await deps.securityRepo.findVisible(input.householdId, input.securityId);
  if (!existing) throw new NotFoundError("Security", input.securityId);
  if (isExchangeSecurity(existing)) {
    throw new ForbiddenError(
      `Security ${existing.ticker} is exchange reference data and can't be edited by hand`,
    );
  }

  await deps.securityRepo.update({
    ...existing,
    name: input.name ?? existing.name,
    face_value: input.faceValue ?? existing.face_value,
    coupon_rate: input.couponRate ?? existing.coupon_rate,
    maturity_date: input.maturityDate ?? existing.maturity_date,
  });
}
