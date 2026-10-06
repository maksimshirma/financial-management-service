import { Currency, SecurityType } from "../../domain/index.js";

/** A search hit — enough to let the user/agent pick the right security. */
export interface SecurityCandidate {
  /** exchange security code (MOEX SECID), stored as `securities.ticker` */
  secid: string;
  isin?: string;
  name: string;
  type: SecurityType;
  boardId?: string;
}

/** Reference data for one security, as the exchange describes it. */
export interface SecuritySpec {
  secid: string;
  isin?: string;
  name: string;
  type: SecurityType;
  currency: Currency;
  boardId: string;
  market: string;
  faceValue?: number;
  couponRate?: number;
  maturityDate?: Date;
}

/** What the provider needs to fetch market data for one security. */
export interface SecurityRef {
  secid: string;
  boardId: string;
  market: string;
}

export interface Quote {
  secid: string;
  /** bonds are quoted as a percent of face value, everything else in currency */
  price: number;
  priceUnit: "currency" | "percent_of_face";
  /** accrued coupon interest per bond, in currency */
  accruedInterest?: number;
  at: Date;
}

export interface CouponPayment {
  date: Date;
  /** per bond, in the bond's currency; absent while the coupon isn't fixed yet */
  amount?: number;
  /** annual rate, percent */
  rate?: number;
}

/** Exchange reference and market data. Implementations may be slow or unavailable. */
export interface MarketDataProvider {
  /** securities of unsupported types/currencies are left out */
  search(query: string): Promise<SecurityCandidate[]>;
  /** null when the exchange doesn't know the code or its type/currency is unsupported */
  getSpec(secid: string): Promise<SecuritySpec | null>;
  /** securities without a current price are left out */
  getQuotes(securities: SecurityRef[]): Promise<Quote[]>;
  getCouponSchedule(secid: string): Promise<CouponPayment[]>;
}
