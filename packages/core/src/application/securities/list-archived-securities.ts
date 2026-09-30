import { SecurityRepository } from "../ports";

export async function listArchivedSecurities(deps: {
  securityRepo: SecurityRepository;
}) {
  return deps.securityRepo.listArchived();
}
