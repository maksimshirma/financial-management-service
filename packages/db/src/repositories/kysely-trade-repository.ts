import { Kysely } from "kysely";
import {
  NewTrade,
  NotFoundError,
  TradeFilter,
  TradeRepository,
  TradesTable,
} from "@fms/core";
import { Database } from "../schema.js";
import { mapPgError } from "../errors.js";

export class KyselyTradeRepository implements TradeRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(
    tradeId: TradesTable["trade_id"],
  ): Promise<TradesTable | null> {
    const row = await this.db
      .selectFrom("trades")
      .selectAll()
      .where("trade_id", "=", tradeId)
      .executeTakeFirst();
    return row ?? null;
  }

  async find(filter: TradeFilter): Promise<TradesTable[]> {
    let query = this.db.selectFrom("trades").selectAll();

    if (filter.accountId !== undefined) {
      query = query.where("account_id", "=", filter.accountId);
    }
    if (filter.securityId !== undefined) {
      query = query.where("security_id", "=", filter.securityId);
    }
    if (filter.from !== undefined) {
      query = query.where("date", ">=", filter.from);
    }
    if (filter.to !== undefined) {
      query = query.where("date", "<=", filter.to);
    }

    return query.execute();
  }

  async create(trade: NewTrade): Promise<TradesTable> {
    return this.db
      .insertInto("trades")
      .values(trade)
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((err) => mapPgError(err, "Trade"));
  }

  async update(trade: TradesTable): Promise<void> {
    const { trade_id, ...fields } = trade;
    const result = await this.db
      .updateTable("trades")
      .set(fields)
      .where("trade_id", "=", trade_id)
      .executeTakeFirst()
      .catch((err) => mapPgError(err, "Trade"));

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Trade", trade_id);
    }
  }

  async delete(tradeId: TradesTable["trade_id"]): Promise<void> {
    const result = await this.db
      .deleteFrom("trades")
      .where("trade_id", "=", tradeId)
      .executeTakeFirst();

    if (result.numDeletedRows === 0n) {
      throw new NotFoundError("Trade", tradeId);
    }
  }
}
