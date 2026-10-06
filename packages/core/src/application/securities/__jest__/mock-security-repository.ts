import { Currency, SecuritiesTable, SecurityType } from "../../../domain/index.js";
import { MarketDataProvider, SecurityRepository } from "../../ports/index.js";

export function createMockSecurityRepository(): jest.Mocked<SecurityRepository> {
  return {
    findById: jest.fn(),
    findVisible: jest.fn(),
    findByTicker: jest.fn(),
    listByHousehold: jest.fn(),
    listArchivedByHousehold: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsertExchange: jest.fn(),
    link: jest.fn(),
    archiveLink: jest.fn(),
  };
}

export function createMockMarketDataProvider(): jest.Mocked<MarketDataProvider> {
  return {
    search: jest.fn(),
    getSpec: jest.fn(),
    getQuotes: jest.fn(),
    getCouponSchedule: jest.fn(),
  };
}

/** an exchange security by default; pass owner_household_id for a private one */
export function buildSecurity(overrides: Partial<SecuritiesTable> = {}): SecuritiesTable {
  return {
    security_id: 1,
    ticker: "SBER",
    name: "Сбербанк",
    type: SecurityType.STOCK,
    currency: Currency.RUB,
    board_id: "TQBR",
    market: "shares",
    ...overrides,
  };
}
