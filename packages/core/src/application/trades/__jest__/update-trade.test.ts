import { NotFoundError } from "../../../domain/index.js";
import { updateTrade } from "../update-trade.js";
import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";

describe("updateTrade", () => {
  it("throws NotFoundError when the trade doesn't exist", async () => {
    const tradeRepo = createMockTradeRepository();
    tradeRepo.findById.mockResolvedValue(null);

    await expect(
      updateTrade({ tradeRepo }, { tradeId: 999, quantity: 5 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(tradeRepo.update).not.toHaveBeenCalled();
  });

  it("merges only the provided fields", async () => {
    const tradeRepo = createMockTradeRepository();
    const existing = buildTrade();
    tradeRepo.findById.mockResolvedValue(existing);

    await updateTrade({ tradeRepo }, { tradeId: 1, quantity: 20 });

    expect(tradeRepo.update).toHaveBeenCalledWith({ ...existing, quantity: 20 });
  });

  it("keeps all fields unchanged when no updates are provided", async () => {
    const tradeRepo = createMockTradeRepository();
    const existing = buildTrade();
    tradeRepo.findById.mockResolvedValue(existing);

    await updateTrade({ tradeRepo }, { tradeId: 1 });

    expect(tradeRepo.update).toHaveBeenCalledWith(existing);
  });
});
