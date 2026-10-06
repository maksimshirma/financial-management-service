import { Currency } from "../shared/index.js";

export enum SecurityType {
  STOCK = "stock",
  BOND = "bond",
  FUND = "fund",
}

/**
 * Shared reference data. Exchange securities (`owner_household_id` absent) come
 * from MOEX and are visible to every household; private ones are entered by
 * hand and visible only to their owner.
 */
export interface SecuritiesTable {
  security_id: number;
  /** for exchange securities — the MOEX SECID */
  ticker: string;
  isin?: string;
  name: string;
  type: SecurityType;
  currency: Currency;
  face_value?: number;
  coupon_rate?: number;
  maturity_date?: Date;
  owner_household_id?: string;
  /** MOEX board and market — needed to fetch quotes */
  board_id?: string;
  market?: string;
  /** when reference fields were last checked against the exchange */
  synced_at?: Date;
}

export type NewSecurity = Omit<SecuritiesTable, "security_id">;

/** A household's own list of securities: what it imported or traded, and what it hid. */
export interface HouseholdSecuritiesTable {
  household_id: string;
  security_id: SecuritiesTable["security_id"];
  is_archived: boolean;
  added_at: Date;
}

export function isExchangeSecurity(security: SecuritiesTable): boolean {
  return security.owner_household_id === undefined;
}
