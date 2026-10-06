import { NotFoundError } from "../../../domain/index.js";
import { recordTrade } from "../record-trade.js";
import { buildTrade, createMockTradeRepository } from "./mock-trade-repository.js";
import { createHouseholdRepos, FOREIGN, OWN } from "../../households/__jest__/household-fixtures.js";

function setup() {
  const tradeRepo = createMockTradeRepository();
  tradeRepo.create.mockResolvedValue(buildTrade());
  const { accountRepo, securityRepo } = createHouseholdRepos();
  return { tradeRepo, accountRepo, securityRepo };
}

describe("recordTrade", () => {
  const { trade_id: _, ...newTrade } = buildTrade({ account_id: OWN, security_id: 2 });

  it("checks the household's account and security, then links the security to it", async () => {
    const deps = setup();

    await recordTrade(deps, "h_demo", newTrade);

    expect(deps.securityRepo.findVisible).toHaveBeenCalledWith("h_demo", 2);
    expect(deps.tradeRepo.create).toHaveBeenCalledWith(newTrade);
    expect(deps.securityRepo.link).toHaveBeenCalledWith("h_demo", 2);
  });

  it("refuses another household's account", async () => {
    const deps = setup();

    await expect(
      recordTrade(deps, "h_demo", { ...newTrade, account_id: FOREIGN }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.tradeRepo.create).not.toHaveBeenCalled();
    expect(deps.securityRepo.link).not.toHaveBeenCalled();
  });

  it("refuses another household's private security", async () => {
    const deps = setup();

    await expect(
      recordTrade(deps, "h_demo", { ...newTrade, security_id: FOREIGN }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.tradeRepo.create).not.toHaveBeenCalled();
  });
});
