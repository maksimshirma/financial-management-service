import { Kysely, Selectable } from "kysely";
import {
  NewSecurity,
  NotFoundError,
  SecuritiesTable,
  SecurityRepository,
} from "@fms/core";
import { Database, SecurityRow } from "../schema";
import { mapPgError } from "../errors";

// domain fields are optional (absent = undefined); the columns are nullable
// (absent = null) — bridge the two directions here, once.
function toDomain(row: Selectable<SecurityRow>): SecuritiesTable {
  return {
    security_id: row.security_id,
    ticker: row.ticker,
    isin: row.isin ?? undefined,
    name: row.name,
    type: row.type,
    currency: row.currency,
    face_value: row.face_value ?? undefined,
    coupon_rate: row.coupon_rate ?? undefined,
    maturity_date: row.maturity_date ?? undefined,
    is_archived: row.is_archived,
  };
}

function toRow(security: NewSecurity | SecuritiesTable) {
  return {
    ticker: security.ticker,
    isin: security.isin ?? null,
    name: security.name,
    type: security.type,
    currency: security.currency,
    face_value: security.face_value ?? null,
    coupon_rate: security.coupon_rate ?? null,
    maturity_date: security.maturity_date ?? null,
    is_archived: security.is_archived,
  };
}

export class KyselySecurityRepository implements SecurityRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(
    securityId: SecuritiesTable["security_id"],
  ): Promise<SecuritiesTable | null> {
    const row = await this.db
      .selectFrom("securities")
      .selectAll()
      .where("security_id", "=", securityId)
      .executeTakeFirst();
    return row ? toDomain(row) : null;
  }

  async findByTicker(
    ticker: SecuritiesTable["ticker"],
  ): Promise<SecuritiesTable | null> {
    const row = await this.db
      .selectFrom("securities")
      .selectAll()
      .where("ticker", "=", ticker)
      .executeTakeFirst();
    return row ? toDomain(row) : null;
  }

  async findByIsin(
    isin: SecuritiesTable["isin"],
  ): Promise<SecuritiesTable | null> {
    const row = await this.db
      .selectFrom("securities")
      .selectAll()
      .where("isin", "=", isin ?? null)
      .executeTakeFirst();
    return row ? toDomain(row) : null;
  }

  async listAll(): Promise<SecuritiesTable[]> {
    const rows = await this.db
      .selectFrom("securities")
      .selectAll()
      .where("is_archived", "=", false)
      .execute();
    return rows.map(toDomain);
  }

  async listArchived(): Promise<SecuritiesTable[]> {
    const rows = await this.db
      .selectFrom("securities")
      .selectAll()
      .where("is_archived", "=", true)
      .execute();
    return rows.map(toDomain);
  }

  async create(security: NewSecurity): Promise<SecuritiesTable> {
    const row = await this.db
      .insertInto("securities")
      .values(toRow(security))
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((err) => mapPgError(err, "Security"));
    return toDomain(row);
  }

  async update(security: SecuritiesTable): Promise<void> {
    const result = await this.db
      .updateTable("securities")
      .set(toRow(security))
      .where("security_id", "=", security.security_id)
      .executeTakeFirst()
      .catch((err) => mapPgError(err, "Security"));

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Security", security.security_id);
    }
  }

  async archive(securityId: SecuritiesTable["security_id"]): Promise<void> {
    const result = await this.db
      .updateTable("securities")
      .set({ is_archived: true })
      .where("security_id", "=", securityId)
      .executeTakeFirst();

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Security", securityId);
    }
  }
}
