import { AccountsTable, AccountType, Currency } from "../../../domain/index.js";
import { AccountRepository } from "../../ports/index.js";

export function createMockAccountRepository(): jest.Mocked<AccountRepository> {
  return {
    findById: jest.fn(),
    findByName: jest.fn(),
    findAllByUser: jest.fn(),
    findArchivedByUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
}

export function buildAccount(overrides: Partial<AccountsTable> = {}): AccountsTable {
  return {
    account_id: 1,
    user_id: 1,
    name: "Cash",
    type: AccountType.CASH,
    currency: Currency.RUB,
    is_archived: false,
    ...overrides,
  };
}
