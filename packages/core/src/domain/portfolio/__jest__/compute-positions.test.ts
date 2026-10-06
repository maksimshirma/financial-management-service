import { TradeType } from "../../trades/index.js";
import { computePositions } from "../index.js";
import { buildTrade } from "../../../application/trades/__jest__/mock-trade-repository.js";

describe("computePositions", () => {
  it("nets buys against sells per security and drops closed positions", () => {
    const positions = computePositions([
      buildTrade({ security_id: 1, type: TradeType.BUY, quantity: 10 }),
      buildTrade({ security_id: 1, type: TradeType.SELL, quantity: 4 }),
      buildTrade({ security_id: 2, type: TradeType.BUY, quantity: 5 }),
      buildTrade({ security_id: 2, type: TradeType.SELL, quantity: 5 }),
      buildTrade({ security_id: 3, type: TradeType.BUY, quantity: 0.5 }),
    ]);

    expect(positions).toEqual([
      { security_id: 1, quantity: 6 },
      { security_id: 3, quantity: 0.5 },
    ]);
  });

  it("returns [] without trades", () => {
    expect(computePositions([])).toEqual([]);
  });
});
