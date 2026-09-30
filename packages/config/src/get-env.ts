import { fileURLToPath } from "node:url";
import type { EnvVarName } from "./env-vars";

process.loadEnvFile(fileURLToPath(new URL("../../../.env", import.meta.url)));

export function getEnv(name: EnvVarName): string | undefined {
  const value = process.env[name];
  if (value === undefined) {
    console.warn(`[@fms/config] "${name}" is not set`);
  }
  return value;
}
