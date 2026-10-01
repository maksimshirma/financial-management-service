import { TradesTable, TradeType } from "../../../domain";
import { TradeRepository } from "../../ports";

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
