import { Currency, SecuritiesTable, SecurityType } from "../../../domain/index.js";
import { SecurityRepository } from "../../ports/index.js";

export function createMockSecurityRepository(): jest.Mocked<SecurityRepository> {
  return {
    findById: jest.fn(),
    findByTicker: jest.fn(),
    findByIsin: jest.fn(),
    listAll: jest.fn(),
    listArchived: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
}

export function buildSecurity(overrides: Partial<SecuritiesTable> = {}): SecuritiesTable {
  return {
    security_id: 1,
    ticker: "SBER",
    name: "Sberbank",
    type: SecurityType.STOCK,
    currency: Currency.RUB,
    is_archived: false,
    ...overrides,
  };
}
