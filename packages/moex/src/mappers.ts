import { Currency, SecurityType } from "@fms/core";

const STOCK_TYPES = new Set(["common_share", "preferred_share", "depositary_receipt"]);

/** ISS `type` (e.g. `ofz_bond`, `exchange_ppif`) → our type; null = unsupported */
export function toSecurityType(issType: unknown): SecurityType | null {
  if (typeof issType !== "string") return null;
  if (STOCK_TYPES.has(issType)) return SecurityType.STOCK;
  if (issType.endsWith("_bond")) return SecurityType.BOND;
  if (issType.endsWith("ppif")) return SecurityType.FUND;
  return null;
}

/** ISS currency code (`SUR` is the legacy code for the rouble) → ours; null = unsupported */
export function toCurrency(issCurrency: unknown): Currency | null {
  switch (issCurrency) {
    case "SUR":
    case "RUB":
      return Currency.RUB;
    case "USD":
      return Currency.USD;
    case "EUR":
      return Currency.EUR;
    default:
      return null;
  }
}

/** ISS sends numbers as numbers in market data but as strings in `description` */
export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function toDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value === "" || value.startsWith("0000")) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}
