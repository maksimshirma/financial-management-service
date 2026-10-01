import { TransactionsTable } from "../../../domain/index.js";
import { TransactionRepository } from "../../ports/index.js";

export function createMockTransactionRepository(): jest.Mocked<TransactionRepository> {
  return {
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

export function buildTransaction(overrides: Partial<TransactionsTable> = {}): TransactionsTable {
  return {
    transaction_id: 1,
    date: new Date("2026-01-01"),
    account_id: 1,
    amount: 100,
    category_id: 1,
    is_transfer: false,
    to_account_id: undefined,
    to_amount: undefined,
    security_id: undefined,
    note: undefined,
    ...overrides,
  };
}
