import { NewTrade, NotFoundError } from "../../domain/index.js";
import { AccountRepository, SecurityRepository, TradeRepository } from "../ports/index.js";

export interface RecordTradeDeps {
  tradeRepo: TradeRepository;
  accountRepo: AccountRepository;
  securityRepo: SecurityRepository;
}

/**
 * Shared by buy/sell: the security must be visible to the account's household,
 * and trading it puts it on that household's list.
 * @throws {NotFoundError} account does not exist, or security isn't visible to its household
 */
export async function recordTrade(deps: RecordTradeDeps, trade: NewTrade) {
  const account = await deps.accountRepo.findById(trade.account_id);
  if (!account) throw new NotFoundError("Account", trade.account_id);

  const security = await deps.securityRepo.findVisible(account.household_id, trade.security_id);
  if (!security) throw new NotFoundError("Security", trade.security_id);

  const created = await deps.tradeRepo.create(trade);
  await deps.securityRepo.link(account.household_id, trade.security_id);
  return created;
}
