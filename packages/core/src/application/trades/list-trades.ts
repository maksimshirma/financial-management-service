import { AccountsTable } from "../../domain/index.js";
import { TradeFilter, TradeRepository } from "../ports/index.js";

/** Only trades on the household's own accounts, whatever else the filter says. */
export async function listTrades(
  deps: { tradeRepo: TradeRepository },
  householdId: AccountsTable["household_id"],
  filter: Omit<TradeFilter, "householdId"> = {},
) {
  return deps.tradeRepo.find({ ...filter, householdId });
}
