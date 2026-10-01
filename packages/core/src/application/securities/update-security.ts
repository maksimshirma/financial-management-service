import { NotFoundError, SecuritiesTable } from "../../domain/index.js";
import { SecurityRepository } from "../ports/index.js";

export interface UpdateSecurityInput {
  securityId: SecuritiesTable["security_id"];
  name?: string;
  faceValue?: number;
  couponRate?: number;
  maturityDate?: Date;
}

/** @throws {NotFoundError} security does not exist */
export async function updateSecurity(
  deps: { securityRepo: SecurityRepository },
  input: UpdateSecurityInput,
) {
  const existing = await deps.securityRepo.findById(input.securityId);
  if (!existing) throw new NotFoundError("Security", input.securityId);

  await deps.securityRepo.update({
    ...existing,
    name: input.name ?? existing.name,
    face_value: input.faceValue ?? existing.face_value,
    coupon_rate: input.couponRate ?? existing.coupon_rate,
    maturity_date: input.maturityDate ?? existing.maturity_date,
  });
}
