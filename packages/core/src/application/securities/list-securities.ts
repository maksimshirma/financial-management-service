import { SecurityRepository } from "../ports/index.js";

export async function listSecurities(deps: {
  securityRepo: SecurityRepository;
}) {
  return deps.securityRepo.listAll();
}
