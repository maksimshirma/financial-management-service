import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { adminDatabaseConfig, testDatabaseConfig, testDatabaseName } from "./config.js";

const schemaDir = fileURLToPath(new URL("../../../db/init", import.meta.url));

// schema only — 08_seed.sql is skipped, tests create their own fixtures.
const SCHEMA_FILES = [
  "01_enums.sql",
  "02_users.sql",
  "03_accounts.sql",
  "04_categories.sql",
  "05_sequrities.sql",
  "06_transactions.sql",
  "07_trades.sql",
];

// DROP/CREATE DATABASE and multi-statement .sql files both require the
// simple query protocol (plain `client.query(sqlString)`, no parameters) —
// Kysely always issues parameterized queries, which reject multiple
// statements in one call, so this talks to `pg` directly.
export async function resetTestDatabase(): Promise<void> {
  const admin = new Client(adminDatabaseConfig());
  await admin.connect();
  try {
    await admin.query(
      `DROP DATABASE IF EXISTS ${testDatabaseName()} WITH (FORCE)`,
    );
    await admin.query(`CREATE DATABASE ${testDatabaseName()}`);
  } finally {
    await admin.end();
  }

  const testDb = new Client(testDatabaseConfig());
  await testDb.connect();
  try {
    for (const file of SCHEMA_FILES) {
      const sql = readFileSync(path.join(schemaDir, file), "utf-8");
      await testDb.query(sql);
    }
  } finally {
    await testDb.end();
  }
}
