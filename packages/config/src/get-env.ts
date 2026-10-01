import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { EnvVarName } from "./env-vars.js";

const envFile = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export function getEnv(name: EnvVarName): string | undefined {
  const value = process.env[name];
  if (value === undefined) {
    console.warn(`[@fms/config] "${name}" is not set`);
  }
  return value;
}
