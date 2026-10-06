import { ForbiddenError, NotFoundError } from "../../../domain/index.js";
import { getSecurityQuote } from "../get-security-quote.js";
import {
  buildSecurity,
  createMockMarketDataProvider,
  createMockSecurityRepository,
} from "../../securities/__jest__/mock-security-repository.js";

describe("getSecurityQuote", () => {
  const quote = { secid: "SBER", price: 282.69, priceUnit: "currency" as const, at: new Date() };

  it("asks the exchange for the security's board", async () => {
    const securityRepo = createMockSecurityRepository();
    const marketData = createMockMarketDataProvider();
    securityRepo.findVisible.mockResolvedValue(buildSecurity());
    marketData.getQuotes.mockResolvedValue([quote]);

    const result = await getSecurityQuote({ securityRepo, marketData }, "h_demo", 1);

    expect(securityRepo.findVisible).toHaveBeenCalledWith("h_demo", 1);
    expect(marketData.getQuotes).toHaveBeenCalledWith([
      { secid: "SBER", boardId: "TQBR", market: "shares" },
    ]);
    expect(result).toBe(quote);
  });

  it("throws NotFoundError for a security the household can't see", async () => {
    const securityRepo = createMockSecurityRepository();
    const marketData = createMockMarketDataProvider();
    securityRepo.findVisible.mockResolvedValue(null);

    await expect(
      getSecurityQuote({ securityRepo, marketData }, "h_demo", 1),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError for a hand-entered security", async () => {
    const securityRepo = createMockSecurityRepository();
    const marketData = createMockMarketDataProvider();
    securityRepo.findVisible.mockResolvedValue(
      buildSecurity({ owner_household_id: "h_demo", board_id: undefined, market: undefined }),
    );

    await expect(
      getSecurityQuote({ securityRepo, marketData }, "h_demo", 1),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(marketData.getQuotes).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the exchange has no price", async () => {
    const securityRepo = createMockSecurityRepository();
    const marketData = createMockMarketDataProvider();
    securityRepo.findVisible.mockResolvedValue(buildSecurity());
    marketData.getQuotes.mockResolvedValue([]);

    await expect(
      getSecurityQuote({ securityRepo, marketData }, "h_demo", 1),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
