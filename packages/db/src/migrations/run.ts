import { fileURLToPath } from "node:url";
import { createKyselyInstance } from "../kysely";
import { createMigrator } from "./migrator";

process.loadEnvFile(
  fileURLToPath(new URL("../../../../.env", import.meta.url)),
);

async function main() {
  const db = createKyselyInstance({
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
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
