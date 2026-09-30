import { Kysely, sql } from "kysely";

// Kysely<any> deliberately, not Kysely<Database> from @fms/db — a raw `sql`
// tag doesn't touch schema types, and typing this against @fms/db would
// create a fixtures -> db dependency that turns db's devDependency on
// fixtures into a workspace cycle pnpm refuses to build topologically.
export async function truncateAllTables(db: Kysely<any>): Promise<void> {
  await sql`TRUNCATE TABLE users, accounts, categories, securities, transactions, trades RESTART IDENTITY CASCADE`.execute(
    db,
  );
}
