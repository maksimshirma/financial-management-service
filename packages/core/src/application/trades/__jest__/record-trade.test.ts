import { NotFoundError } from "../../../domain/index.js";
import { recordTrade } from "../record-trade.js";
import {
  buildTrade,
  createMockTradeRepository,
  createTradeLookupRepos,
} from "./mock-trade-repository.js";

describe("recordTrade", () => {
  const { trade_id: _, ...newTrade } = buildTrade({ account_id: 1, security_id: 2 });

  it("checks visibility against the account's household and links the security to it", async () => {
    const tradeRepo = createMockTradeRepository();
    const created = buildTrade();
    tradeRepo.create.mockResolvedValue(created);
    const { accountRepo, securityRepo } = createTradeLookupRepos();

    const result = await recordTrade({ tradeRepo, accountRepo, securityRepo }, newTrade);

    expect(securityRepo.findVisible).toHaveBeenCalledWith("h_demo", 2);
    expect(tradeRepo.create).toHaveBeenCalledWith(newTrade);
    expect(securityRepo.link).toHaveBeenCalledWith("h_demo", 2);
    expect(result).toBe(created);
  });

  it("throws NotFoundError when the account doesn't exist", async () => {
    const tradeRepo = createMockTradeRepository();
    const { accountRepo, securityRepo } = createTradeLookupRepos();
    accountRepo.findById.mockResolvedValue(null);

    await expect(
      recordTrade({ tradeRepo, accountRepo, securityRepo }, newTrade),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(tradeRepo.create).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for another household's private security", async () => {
    const tradeRepo = createMockTradeRepository();
    const { accountRepo, securityRepo } = createTradeLookupRepos();
    securityRepo.findVisible.mockResolvedValue(null);

    await expect(
      recordTrade({ tradeRepo, accountRepo, securityRepo }, newTrade),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(tradeRepo.create).not.toHaveBeenCalled();
    expect(securityRepo.link).not.toHaveBeenCalled();
  });
});
