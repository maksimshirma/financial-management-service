import { AccountsTable, NewTrade } from "../../domain/index.js";
import { AccountRepository, SecurityRepository, TradeRepository } from "../ports/index.js";
import { requireOwnAccount, requireVisibleSecurity } from "../households/household-access.js";

export interface RecordTradeDeps {
  tradeRepo: TradeRepository;
  accountRepo: AccountRepository;
  securityRepo: SecurityRepository;
}

/**
 * Shared by buy/sell: the account must be the household's own and the
 * security visible to it; trading puts the security on the household's list.
 * @throws {NotFoundError} account isn't the household's, or security isn't visible to it
 */
export async function recordTrade(
  deps: RecordTradeDeps,
  householdId: AccountsTable["household_id"],
  trade: NewTrade,
) {
  await requireOwnAccount(deps.accountRepo, householdId, trade.account_id);
  await requireVisibleSecurity(deps.securityRepo, householdId, trade.security_id);

  const created = await deps.tradeRepo.create(trade);
  await deps.securityRepo.link(householdId, trade.security_id);
  return created;
}
