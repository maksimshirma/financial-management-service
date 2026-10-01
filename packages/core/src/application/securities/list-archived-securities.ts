import { SecurityRepository } from "../ports/index.js";

export async function listArchivedSecurities(deps: {
  securityRepo: SecurityRepository;
}) {
  return deps.securityRepo.listArchived();
}
