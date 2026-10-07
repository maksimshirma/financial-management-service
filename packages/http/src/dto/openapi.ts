import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  type RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import type { ZodTypeAny } from "zod";
import * as s from "./schemas.js";
import { z } from "./zod.js";

type Method = "get" | "post" | "patch" | "delete";

export interface RouteSpec {
  /** operationId — named after the use-case the route calls */
  id: string;
  method: Method;
  /** OpenAPI path template, e.g. "/accounts/{accountId}" */
  path: string;
  tag: string;
  summary: string;
  scope: "view" | "edit";
  params?: z.AnyZodObject;
  query?: z.AnyZodObject;
  body?: ZodTypeAny;
  /** success status → response body schema (null = no body) */
  success: [status: 200 | 201 | 204, schema: ZodTypeAny | null];
  /** error statuses beyond the 400/401/403 every route can return */
  errors?: (404 | 409 | 503)[];
}

const list = (schema: ZodTypeAny) => z.array(schema);

/** Every route the HTTP server exposes. The route tests fail on calls missing here. */
export const routeSpecs: RouteSpec[] = [
  // accounts
  { id: "listAccounts", method: "get", path: "/accounts", tag: "accounts", summary: "List the household's active accounts", scope: "view", success: [200, list(s.Account)] },
  { id: "listArchivedAccounts", method: "get", path: "/accounts/archived", tag: "accounts", summary: "List archived accounts", scope: "view", success: [200, list(s.Account)] },
  { id: "getAccount", method: "get", path: "/accounts/{accountId}", tag: "accounts", summary: "Get an account", scope: "view", params: s.AccountIdParams, success: [200, s.Account], errors: [404] },
  { id: "createAccount", method: "post", path: "/accounts", tag: "accounts", summary: "Create an account", scope: "edit", body: s.CreateAccountBody, success: [201, s.Account], errors: [409] },
  { id: "updateAccount", method: "patch", path: "/accounts/{accountId}", tag: "accounts", summary: "Update an account", scope: "edit", params: s.AccountIdParams, body: s.UpdateAccountBody, success: [204, null], errors: [404, 409] },
  { id: "archiveAccount", method: "post", path: "/accounts/{accountId}/archive", tag: "accounts", summary: "Archive an account", scope: "edit", params: s.AccountIdParams, success: [204, null], errors: [404] },

  // categories
  { id: "listCategories", method: "get", path: "/categories", tag: "categories", summary: "List the household's active categories", scope: "view", success: [200, list(s.Category)] },
  { id: "listArchivedCategories", method: "get", path: "/categories/archived", tag: "categories", summary: "List archived categories", scope: "view", success: [200, list(s.Category)] },
  { id: "createCategory", method: "post", path: "/categories", tag: "categories", summary: "Create a category", scope: "edit", body: s.CreateCategoryBody, success: [201, s.Category], errors: [409] },
  { id: "updateCategory", method: "patch", path: "/categories/{categoryId}", tag: "categories", summary: "Rename a category", scope: "edit", params: s.CategoryIdParams, body: s.UpdateCategoryBody, success: [204, null], errors: [404, 409] },
  { id: "archiveCategory", method: "post", path: "/categories/{categoryId}/archive", tag: "categories", summary: "Archive a category", scope: "edit", params: s.CategoryIdParams, success: [204, null], errors: [404] },

  // securities
  { id: "listSecurities", method: "get", path: "/securities", tag: "securities", summary: "List the household's active securities", scope: "view", success: [200, list(s.Security)] },
  { id: "listArchivedSecurities", method: "get", path: "/securities/archived", tag: "securities", summary: "List the household's archived securities", scope: "view", success: [200, list(s.Security)] },
  { id: "findSecurityByTicker", method: "get", path: "/securities/by-ticker/{ticker}", tag: "securities", summary: "Find a registered security by exact ticker", scope: "view", params: s.TickerParams, success: [200, s.Security], errors: [404] },
  { id: "searchSecurities", method: "get", path: "/securities/search", tag: "securities", summary: "Search the Moscow Exchange (doesn't change anything)", scope: "view", query: s.SearchSecuritiesQuery, success: [200, list(s.SecurityCandidate)], errors: [503] },
  { id: "importSecurity", method: "post", path: "/securities/import", tag: "securities", summary: "Import a MOEX security into the household's list (idempotent)", scope: "edit", body: s.ImportSecurityBody, success: [201, s.Security], errors: [404, 409, 503] },
  { id: "createSecurity", method: "post", path: "/securities", tag: "securities", summary: "Create a hand-entered security outside MOEX, private to the household", scope: "edit", body: s.CreateSecurityBody, success: [201, s.Security], errors: [409] },
  { id: "updateSecurity", method: "patch", path: "/securities/{securityId}", tag: "securities", summary: "Update a hand-entered security (exchange ones are read-only: 403)", scope: "edit", params: s.SecurityIdParams, body: s.UpdateSecurityBody, success: [204, null], errors: [404, 409] },
  { id: "archiveSecurity", method: "post", path: "/securities/{securityId}/archive", tag: "securities", summary: "Hide a security from the household's list", scope: "edit", params: s.SecurityIdParams, success: [204, null], errors: [404] },
  { id: "getSecurityQuote", method: "get", path: "/securities/{securityId}/quote", tag: "securities", summary: "Current MOEX price (delayed up to 15 min)", scope: "view", params: s.SecurityIdParams, success: [200, s.Quote], errors: [404, 503] },
  { id: "getBondSchedule", method: "get", path: "/securities/{securityId}/coupons", tag: "securities", summary: "Upcoming coupons of a MOEX bond", scope: "view", params: s.SecurityIdParams, success: [200, list(s.CouponPayment)], errors: [404, 503] },

  // trades
  { id: "listTrades", method: "get", path: "/trades", tag: "trades", summary: "List the household's trades", scope: "view", query: s.ListTradesQuery, success: [200, list(s.Trade)] },
  { id: "buySecurity", method: "post", path: "/trades/buy", tag: "trades", summary: "Record a purchase", scope: "edit", body: s.TradeBody, success: [201, s.Trade], errors: [404] },
  { id: "sellSecurity", method: "post", path: "/trades/sell", tag: "trades", summary: "Record a sale", scope: "edit", body: s.TradeBody, success: [201, s.Trade], errors: [404] },
  { id: "updateTrade", method: "patch", path: "/trades/{tradeId}", tag: "trades", summary: "Update a trade", scope: "edit", params: s.TradeIdParams, body: s.UpdateTradeBody, success: [204, null], errors: [404] },
  { id: "deleteTrade", method: "delete", path: "/trades/{tradeId}", tag: "trades", summary: "Delete a trade", scope: "edit", params: s.TradeIdParams, success: [204, null], errors: [404] },

  // transactions
  { id: "listTransactions", method: "get", path: "/transactions", tag: "transactions", summary: "List the household's transactions", scope: "view", query: s.ListTransactionsQuery, success: [200, list(s.Transaction)] },
  { id: "recordIncomeExpense", method: "post", path: "/transactions", tag: "transactions", summary: "Record income or expense", scope: "edit", body: s.RecordIncomeExpenseBody, success: [201, s.Transaction], errors: [404] },
  { id: "transferBetweenAccounts", method: "post", path: "/transactions/transfer", tag: "transactions", summary: "Transfer between the household's own accounts", scope: "edit", body: s.TransferBody, success: [201, s.Transaction], errors: [404] },
  { id: "updateTransaction", method: "patch", path: "/transactions/{transactionId}", tag: "transactions", summary: "Update a transaction", scope: "edit", params: s.TransactionIdParams, body: s.UpdateTransactionBody, success: [204, null], errors: [404] },
  { id: "deleteTransaction", method: "delete", path: "/transactions/{transactionId}", tag: "transactions", summary: "Delete a transaction", scope: "edit", params: s.TransactionIdParams, success: [204, null], errors: [404] },

  // portfolio
  { id: "getPortfolioValue", method: "get", path: "/portfolio/value", tag: "portfolio", summary: "Open positions valued at current MOEX prices", scope: "view", success: [200, s.PortfolioValue] },
];

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: "Invalid request",
  401: "Missing, invalid or expired token",
  403: "Token lacks the scope or household, or the operation isn't allowed",
  404: "Not found, or belongs to another household",
  409: "Duplicate (name, ticker, ISIN)",
  503: "MOEX ISS unavailable — retry later",
};

function toRouteConfig(spec: RouteSpec): RouteConfig {
  const [status, schema] = spec.success;
  const json = (body: ZodTypeAny) => ({ content: { "application/json": { schema: body } } });
  const errors = Object.fromEntries(
    [400, 401, 403, ...(spec.errors ?? [])].map((code) => [
      code,
      { description: ERROR_DESCRIPTIONS[code], ...json(s.ErrorResponse) },
    ]),
  );

  return {
    operationId: spec.id,
    method: spec.method,
    path: spec.path,
    tags: [spec.tag],
    summary: spec.summary,
    description: `Requires scope \`app:${spec.scope}\` and a household (\`hid\`) in the token.`,
    security: [{ internalJwt: [] }],
    request: {
      params: spec.params,
      query: spec.query,
      body: spec.body && { required: true, ...json(spec.body) },
    },
    responses: {
      [status]: { description: status === 204 ? "Done" : "OK", ...(schema ? json(schema) : {}) },
      ...errors,
    },
  };
}

export type OpenApiDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function buildOpenApiDocument(): OpenApiDocument {
  const registry = new OpenAPIRegistry();
  registry.registerComponent("securitySchemes", "internalJwt", {
    type: "apiKey",
    in: "header",
    name: "Authorization",
    description:
      "Internal-JWT issued by identity-service, sent as `Internal <jwt>` (type the whole value, including the `Internal ` prefix).",
  });
  for (const spec of routeSpecs) registry.registerPath(toRouteConfig(spec));

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.3",
    servers: [{ url: "/", description: "This server" }],
    info: {
      title: "Financial management service API",
      version: "1.0.0",
      description:
        "Personal finance tracker: accounts, categories, transactions, securities and trades. Every route acts on the household (`hid`) of the caller's internal-JWT; another household's data is reported as 404.",
    },
  });
}
