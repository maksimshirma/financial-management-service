import { AccountType, CategoryType, Currency, SecurityType, TradeType } from "@fms/core";
import { z } from "./zod.js";

// Request schemas are what the routes parse; response schemas describe what
// they send back (JSON — dates arrive as ISO strings). Both feed /openapi.json.

const id = (name: string) => z.coerce.number().int().positive().openapi({ param: { name, in: "path" } });
const dateTime = () => z.string().openapi({ format: "date-time" });
const householdId = z.string().openapi({ example: "h_demo" });

// --- path params --------------------------------------------------------------

export const AccountIdParams = z.object({ accountId: id("accountId") });
export const CategoryIdParams = z.object({ categoryId: id("categoryId") });
export const SecurityIdParams = z.object({ securityId: id("securityId") });
export const TradeIdParams = z.object({ tradeId: id("tradeId") });
export const TransactionIdParams = z.object({ transactionId: id("transactionId") });
export const TickerParams = z.object({
  ticker: z.string().openapi({ param: { name: "ticker", in: "path" }, example: "SBER" }),
});

// --- requests -------------------------------------------------------------------

export const CreateAccountBody = z.object({
  name: z.string().openapi({ example: "Брокерский счёт" }),
  type: z.nativeEnum(AccountType),
  currency: z.nativeEnum(Currency),
});

export const UpdateAccountBody = z.object({
  name: z.string().optional(),
  type: z.nativeEnum(AccountType).optional(),
  currency: z.nativeEnum(Currency).optional(),
});

export const CreateCategoryBody = z.object({
  name: z.string().openapi({ example: "Еда" }),
  type: z.nativeEnum(CategoryType),
});

export const UpdateCategoryBody = z.object({ name: z.string() });

export const SearchSecuritiesQuery = z.object({
  q: z.string().min(2).openapi({ description: "Ticker, ISIN or part of the name", example: "ОФЗ 26238" }),
});

export const ImportSecurityBody = z.object({
  secid: z.string().openapi({ description: "MOEX security code from /securities/search", example: "SU26238RMFS4" }),
});

export const CreateSecurityBody = z.object({
  ticker: z.string().openapi({ example: "AAPL" }),
  isin: z.string().optional(),
  name: z.string(),
  type: z.nativeEnum(SecurityType),
  currency: z.nativeEnum(Currency),
  faceValue: z.number().optional().openapi({ description: "Bonds only" }),
  couponRate: z.number().optional().openapi({ description: "Bonds only, annual %" }),
  maturityDate: z.coerce.date().optional().openapi({ type: "string", format: "date", description: "Bonds only" }),
});

export const UpdateSecurityBody = z.object({
  name: z.string().optional(),
  faceValue: z.number().optional(),
  couponRate: z.number().optional(),
  maturityDate: z.coerce.date().optional().openapi({ type: "string", format: "date" }),
});

const optionalDate = () => z.coerce.date().optional().openapi({ type: "string", format: "date" });

export const TradeBody = z.object({
  accountId: z.number().int(),
  securityId: z.number().int(),
  quantity: z.number(),
  price: z.number().openapi({ description: "Per unit, in the security's currency" }),
  accruedInterest: z.number().optional().openapi({ description: "Bonds: accrued interest paid/received" }),
  fee: z.number().optional(),
  date: optionalDate().openapi({ description: "Defaults to today" }),
});

export const UpdateTradeBody = z.object({
  date: optionalDate(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  accruedInterest: z.number().optional(),
  fee: z.number().optional(),
});

export const ListTradesQuery = z.object({
  accountId: z.coerce.number().int().optional(),
  securityId: z.coerce.number().int().optional(),
  from: optionalDate(),
  to: optionalDate(),
});

export const RecordIncomeExpenseBody = z.object({
  accountId: z.number().int(),
  amount: z.number(),
  categoryId: z.number().int(),
  date: optionalDate(),
  note: z.string().optional(),
});

export const TransferBody = z.object({
  accountId: z.number().int(),
  toAccountId: z.number().int(),
  amount: z.number(),
  toAmount: z.number().optional().openapi({ description: "Amount credited, if it differs (currency exchange)" }),
  date: optionalDate(),
  note: z.string().optional(),
});

export const UpdateTransactionBody = z.object({
  date: optionalDate(),
  amount: z.number().optional(),
  categoryId: z.number().int().optional(),
  toAccountId: z.number().int().optional(),
  toAmount: z.number().optional(),
  securityId: z.number().int().optional(),
  note: z.string().optional(),
});

export const ListTransactionsQuery = z.object({
  accountId: z.coerce.number().int().optional(),
  from: optionalDate(),
  to: optionalDate(),
});

// --- responses ------------------------------------------------------------------

export const ErrorResponse = z
  .object({
    error: z.string().openapi({ example: "not_found" }),
    message: z.string().optional(),
    issues: z
      .array(z.object({ message: z.string(), path: z.array(z.union([z.string(), z.number()])) }).passthrough())
      .optional()
      .openapi({ description: "Validation issues (400)" }),
  })
  .openapi("Error");

export const Account = z
  .object({
    account_id: z.number().int(),
    household_id: householdId,
    name: z.string(),
    type: z.nativeEnum(AccountType),
    currency: z.nativeEnum(Currency),
    is_archived: z.boolean(),
  })
  .openapi("Account");

export const Category = z
  .object({
    category_id: z.number().int(),
    household_id: householdId,
    name: z.string(),
    type: z.nativeEnum(CategoryType),
    is_archived: z.boolean(),
  })
  .openapi("Category");

export const Security = z
  .object({
    security_id: z.number().int(),
    ticker: z.string().openapi({ description: "MOEX SECID for exchange securities", example: "SBER" }),
    isin: z.string().optional(),
    name: z.string(),
    type: z.nativeEnum(SecurityType),
    currency: z.nativeEnum(Currency),
    face_value: z.number().optional(),
    coupon_rate: z.number().optional(),
    maturity_date: dateTime().optional(),
    owner_household_id: z.string().optional().openapi({ description: "Absent for exchange securities" }),
    board_id: z.string().optional(),
    market: z.string().optional(),
    synced_at: dateTime().optional(),
  })
  .openapi("Security");

export const SecurityCandidate = z
  .object({
    secid: z.string(),
    isin: z.string().optional(),
    name: z.string(),
    type: z.nativeEnum(SecurityType),
    boardId: z.string().optional(),
  })
  .openapi("SecurityCandidate");

export const Quote = z
  .object({
    secid: z.string(),
    price: z.number(),
    priceUnit: z.enum(["currency", "percent_of_face"]),
    accruedInterest: z.number().optional().openapi({ description: "Bonds: per bond, in currency" }),
    at: dateTime(),
  })
  .openapi("Quote");

export const CouponPayment = z
  .object({
    date: dateTime(),
    amount: z.number().optional().openapi({ description: "Absent while a floating coupon isn't fixed" }),
    rate: z.number().optional(),
  })
  .openapi("CouponPayment");

export const Trade = z
  .object({
    trade_id: z.number().int(),
    date: dateTime(),
    account_id: z.number().int(),
    security_id: z.number().int(),
    type: z.nativeEnum(TradeType),
    quantity: z.number(),
    price: z.number(),
    accrued_interest: z.number(),
    fee: z.number(),
  })
  .openapi("Trade");

export const Transaction = z
  .object({
    transaction_id: z.number().int(),
    date: dateTime(),
    account_id: z.number().int(),
    amount: z.number(),
    category_id: z.number().int().optional(),
    is_transfer: z.boolean(),
    to_account_id: z.number().int().optional(),
    to_amount: z.number().optional(),
    security_id: z.number().int().optional(),
    note: z.string().optional(),
  })
  .openapi("Transaction");

export const PortfolioValue = z
  .object({
    positions: z.array(
      z.object({
        securityId: z.number().int(),
        ticker: z.string(),
        name: z.string(),
        type: z.nativeEnum(SecurityType),
        currency: z.nativeEnum(Currency),
        quantity: z.number(),
        price: z.number().optional(),
        priceUnit: z.enum(["currency", "percent_of_face"]).optional(),
        accruedInterest: z.number().optional(),
        value: z.number().optional().openapi({ description: "Absent when the position couldn't be priced" }),
        quotedAt: dateTime().optional(),
      }),
    ),
    totals: z.record(z.nativeEnum(Currency), z.number()).openapi({ example: { RUB: 24935.64 } }),
    unpriced: z.array(z.string()).openapi({ description: "Tickers left out of the totals" }),
    quotesError: z.string().optional().openapi({ description: "Set when the exchange couldn't be reached" }),
  })
  .openapi("PortfolioValue");
