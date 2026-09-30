import { SecurityRepository } from "../ports";

export async function listSecurities(deps: {
  securityRepo: SecurityRepository;
}) {
  return deps.securityRepo.listAll();
}
