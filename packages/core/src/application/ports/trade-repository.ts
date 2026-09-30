import { NewTrade, NotFoundError, TradesTable } from "../../domain";

export interface TradeFilter {
  accountId?: TradesTable["account_id"];
  securityId?: TradesTable["security_id"];
  from?: Date;
  to?: Date;
}

export interface TradeRepository {
  findById(tradeId: TradesTable["trade_id"]): Promise<TradesTable | null>;
  /** filters combine with AND; omitted fields are unconstrained */
  find(filter: TradeFilter): Promise<TradesTable[]>;
  /** @throws {NotFoundError} referenced account or security does not exist */
  create(trade: NewTrade): Promise<TradesTable>;
  /** @throws {NotFoundError} trade, or a referenced account/security, does not exist */
  update(trade: TradesTable): Promise<void>;
  /** @throws {NotFoundError} trade does not exist */
  delete(tradeId: TradesTable["trade_id"]): Promise<void>;
}
