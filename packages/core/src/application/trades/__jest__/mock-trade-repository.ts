import { AccountType, TradesTable, TradeType } from "../../../domain/index.js";
import { TradeRepository } from "../../ports/index.js";
import {
  buildAccount,
  createMockAccountRepository,
} from "../../accounts/__jest__/mock-account-repository.js";
import {
  buildSecurity,
  createMockSecurityRepository,
} from "../../securities/__jest__/mock-security-repository.js";

export function createMockTradeRepository(): jest.Mocked<TradeRepository> {
  return {
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

export function buildTrade(overrides: Partial<TradesTable> = {}): TradesTable {
  return {
    trade_id: 1,
    date: new Date("2026-01-01"),
    account_id: 1,
    security_id: 1,
    type: TradeType.BUY,
    quantity: 10,
    price: 100,
    accrued_interest: 0,
    fee: 0,
    ...overrides,
  };
}

/**
 * Account/security repos for buy/sell: by default account 1 belongs to
 * "h_demo" and every security is visible to it.
 */
export function createTradeLookupRepos() {
  const accountRepo = createMockAccountRepository();
  accountRepo.findById.mockResolvedValue(buildAccount({ type: AccountType.BROKER }));
  const securityRepo = createMockSecurityRepository();
  securityRepo.findVisible.mockResolvedValue(buildSecurity({ security_id: 2 }));
  return { accountRepo, securityRepo };
}
