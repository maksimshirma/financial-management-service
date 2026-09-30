import { fileURLToPath } from "node:url";
import { PoolConfig } from "pg";

process.loadEnvFile(fileURLToPath(new URL("../../../.env", import.meta.url)));

export function testDatabaseName(): string {
  return `${process.env.POSTGRES_DB}_test`;
}

function baseConfig(): Omit<PoolConfig, "database"> {
  return {
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  };
}

export function adminDatabaseConfig(): PoolConfig {
  return { ...baseConfig(), database: process.env.POSTGRES_DB };
}

export function testDatabaseConfig(): PoolConfig {
  return { ...baseConfig(), database: testDatabaseName() };
}
