import { Kysely, PostgresDialect } from "kysely";
import { Pool, PoolConfig, types } from "pg";
import { Database } from "./schema.js";

// pg returns NUMERIC (oid 1700) as a string by default to avoid precision
// loss; every money/quantity column in the schema is NUMERIC but the core
// domain types promise `number`, so parse eagerly here.
types.setTypeParser(1700, parseFloat);

export function createKyselyInstance(config: PoolConfig): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new Pool(config) }),
  });
}
