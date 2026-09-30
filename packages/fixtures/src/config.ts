import { getEnv } from "@fms/config";
import { PoolConfig } from "pg";

export function testDatabaseName(): string {
  return `${getEnv("POSTGRES_DB")}_test`;
}

function baseConfig(): Omit<PoolConfig, "database"> {
  return {
    host: getEnv("POSTGRES_HOST") ?? "localhost",
    port: Number(getEnv("POSTGRES_PORT")),
    user: getEnv("POSTGRES_USER"),
    password: getEnv("POSTGRES_PASSWORD"),
  };
}

export function adminDatabaseConfig(): PoolConfig {
  return { ...baseConfig(), database: getEnv("POSTGRES_DB") };
}

export function testDatabaseConfig(): PoolConfig {
  return { ...baseConfig(), database: testDatabaseName() };
}
