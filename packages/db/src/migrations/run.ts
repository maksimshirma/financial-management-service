import { getEnv } from "@fms/config";
import { createKyselyInstance } from "../kysely.js";
import { createMigrator } from "./migrator.js";

async function main() {
  const db = createKyselyInstance({
    host: getEnv("POSTGRES_HOST") ?? "localhost",
    port: Number(getEnv("POSTGRES_PORT")),
    user: getEnv("POSTGRES_USER"),
    password: getEnv("POSTGRES_PASSWORD"),
    database: getEnv("POSTGRES_DB"),
  });

  const migrator = createMigrator(db);
  const { error, results } = await migrator.migrateToLatest();

  for (const result of results ?? []) {
    console.log(`${result.status}: ${result.migrationName}`);
  }

  if (error) {
    console.error(error);
    process.exitCode = 1;
  }

  await db.destroy();
}

main();
