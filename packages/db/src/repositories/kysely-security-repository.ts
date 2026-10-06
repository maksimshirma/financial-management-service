import { Kysely, Selectable } from "kysely";
import {
  HouseholdSecuritiesTable,
  NewSecurity,
  NotFoundError,
  SecuritiesTable,
  SecurityRepository,
} from "@fms/core";
import { Database, SecurityRow } from "../schema.js";
import { mapPgError } from "../errors.js";

type HouseholdId = HouseholdSecuritiesTable["household_id"];
type SecurityId = SecuritiesTable["security_id"];

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
    owner_household_id: row.owner_household_id ?? undefined,
    board_id: row.board_id ?? undefined,
    market: row.market ?? undefined,
    synced_at: row.synced_at ?? undefined,
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
    owner_household_id: security.owner_household_id ?? null,
    board_id: security.board_id ?? null,
    market: security.market ?? null,
    synced_at: security.synced_at ?? null,
  };
}

export class KyselySecurityRepository implements SecurityRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(securityId: SecurityId): Promise<SecuritiesTable | null> {
    const row = await this.db
      .selectFrom("securities")
      .selectAll()
      .where("security_id", "=", securityId)
      .executeTakeFirst();
    return row ? toDomain(row) : null;
  }

  async findVisible(
    householdId: HouseholdId,
    securityId: SecurityId,
  ): Promise<SecuritiesTable | null> {
    const row = await this.visibleTo(householdId)
      .where("security_id", "=", securityId)
      .executeTakeFirst();
    return row ? toDomain(row) : null;
  }

  async findByTicker(
    householdId: HouseholdId,
    ticker: SecuritiesTable["ticker"],
  ): Promise<SecuritiesTable | null> {
    const row = await this.visibleTo(householdId)
      .where("ticker", "=", ticker)
      // the exchange security wins a clash with a private one of the same ticker
      .orderBy("owner_household_id", (ob) => ob.asc().nullsFirst())
      .executeTakeFirst();
    return row ? toDomain(row) : null;
  }

  listByHousehold(householdId: HouseholdId): Promise<SecuritiesTable[]> {
    return this.listLinked(householdId, false);
  }

  listArchivedByHousehold(householdId: HouseholdId): Promise<SecuritiesTable[]> {
    return this.listLinked(householdId, true);
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

  async upsertExchange(security: NewSecurity): Promise<SecuritiesTable> {
    const { ticker: _, owner_household_id: __, ...reference } = toRow(security);
    const row = await this.db
      .insertInto("securities")
      .values({ ...toRow(security), owner_household_id: null })
      // target the partial unique index uq_securities_ticker_exchange
      .onConflict((oc) =>
        oc
          .column("ticker")
          .where("owner_household_id", "is", null)
          .doUpdateSet(reference),
      )
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((err) => mapPgError(err, "Security"));
    return toDomain(row);
  }

  async link(householdId: HouseholdId, securityId: SecurityId): Promise<void> {
    await this.db
      .insertInto("household_securities")
      .values({ household_id: householdId, security_id: securityId })
      .onConflict((oc) =>
        oc.columns(["household_id", "security_id"]).doUpdateSet({ is_archived: false }),
      )
      .execute()
      .catch((err) => mapPgError(err, "Security"));
  }

  async archiveLink(householdId: HouseholdId, securityId: SecurityId): Promise<void> {
    const result = await this.db
      .updateTable("household_securities")
      .set({ is_archived: true })
      .where("household_id", "=", householdId)
      .where("security_id", "=", securityId)
      .executeTakeFirst();

    if (result.numUpdatedRows === 0n) {
      throw new NotFoundError("Security", securityId);
    }
  }

  private visibleTo(householdId: HouseholdId) {
    return this.db
      .selectFrom("securities")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb("owner_household_id", "is", null),
          eb("owner_household_id", "=", householdId),
        ]),
      );
  }

  private async listLinked(
    householdId: HouseholdId,
    archived: boolean,
  ): Promise<SecuritiesTable[]> {
    const rows = await this.db
      .selectFrom("securities")
      .innerJoin(
        "household_securities",
        "household_securities.security_id",
        "securities.security_id",
      )
      .selectAll("securities")
      .where("household_securities.household_id", "=", householdId)
      .where("household_securities.is_archived", "=", archived)
      .orderBy("securities.ticker")
      .execute();
    return rows.map(toDomain);
  }
}
