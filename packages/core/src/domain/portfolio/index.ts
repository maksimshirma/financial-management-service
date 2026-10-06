import { SecuritiesTable } from "../securities/index.js";
import { TradesTable, TradeType } from "../trades/index.js";

export interface Position {
  security_id: SecuritiesTable["security_id"];
  quantity: number;
}

/** Net quantity per security (buys − sells); closed positions are left out. */
export function computePositions(trades: TradesTable[]): Position[] {
  const quantities = new Map<number, number>();
  for (const trade of trades) {
    const sign = trade.type === TradeType.BUY ? 1 : -1;
    quantities.set(
      trade.security_id,
      (quantities.get(trade.security_id) ?? 0) + sign * trade.quantity,
    );
  }
  return [...quantities]
    .filter(([, quantity]) => Math.abs(quantity) > 1e-9)
    .map(([security_id, quantity]) => ({ security_id, quantity }));
}
