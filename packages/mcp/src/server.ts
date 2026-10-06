import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AccountRepository,
  CategoryRepository,
  Clock,
  MarketDataProvider,
  SecurityRepository,
  TradeRepository,
  TransactionRepository,
} from "@fms/core";

import { registerArchiveAccountTool } from "./tools/accounts/archive-account.js";
import { registerCreateAccountTool } from "./tools/accounts/create-account.js";
import { registerGetAccountTool } from "./tools/accounts/get-account.js";
import { registerListAccountsTool } from "./tools/accounts/list-accounts.js";
import { registerListArchivedAccountsTool } from "./tools/accounts/list-archived-accounts.js";
import { registerUpdateAccountTool } from "./tools/accounts/update-account.js";

import { registerArchiveCategoryTool } from "./tools/categories/archive-category.js";
import { registerCreateCategoryTool } from "./tools/categories/create-category.js";
import { registerListArchivedCategoriesTool } from "./tools/categories/list-archived-categories.js";
import { registerListCategoriesTool } from "./tools/categories/list-categories.js";
import { registerUpdateCategoryTool } from "./tools/categories/update-category.js";

import { registerArchiveSecurityTool } from "./tools/securities/archive-security.js";
import { registerCreateSecurityTool } from "./tools/securities/create-security.js";
import { registerFindSecurityByTickerTool } from "./tools/securities/find-security-by-ticker.js";
import { registerImportSecurityTool } from "./tools/securities/import-security.js";
import { registerListArchivedSecuritiesTool } from "./tools/securities/list-archived-securities.js";
import { registerListSecuritiesTool } from "./tools/securities/list-securities.js";
import { registerSearchSecuritiesTool } from "./tools/securities/search-securities.js";
import { registerUpdateSecurityTool } from "./tools/securities/update-security.js";

import { registerDeleteTransactionTool } from "./tools/transactions/delete-transaction.js";
import { registerListTransactionsTool } from "./tools/transactions/list-transactions.js";
import { registerRecordIncomeExpenseTool } from "./tools/transactions/record-income-expense.js";
import { registerTransferBetweenAccountsTool } from "./tools/transactions/transfer-between-accounts.js";
import { registerUpdateTransactionTool } from "./tools/transactions/update-transaction.js";

import { registerBuySecurityTool } from "./tools/trades/buy-security.js";
import { registerDeleteTradeTool } from "./tools/trades/delete-trade.js";
import { registerListTradesTool } from "./tools/trades/list-trades.js";
import { registerSellSecurityTool } from "./tools/trades/sell-security.js";
import { registerUpdateTradeTool } from "./tools/trades/update-trade.js";

export interface ServerDeps {
  accountRepo: AccountRepository;
  categoryRepo: CategoryRepository;
  securityRepo: SecurityRepository;
  transactionRepo: TransactionRepository;
  tradeRepo: TradeRepository;
  marketData: MarketDataProvider;
  clock: Clock;
}

export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer({ name: "fms-mcp", version: "1.0.0" });

  registerCreateAccountTool(server, deps);
  registerUpdateAccountTool(server, deps);
  registerArchiveAccountTool(server, deps);
  registerListAccountsTool(server, deps);
  registerListArchivedAccountsTool(server, deps);
  registerGetAccountTool(server, deps);

  registerCreateCategoryTool(server, deps);
  registerUpdateCategoryTool(server, deps);
  registerArchiveCategoryTool(server, deps);
  registerListCategoriesTool(server, deps);
  registerListArchivedCategoriesTool(server, deps);

  registerCreateSecurityTool(server, deps);
  registerUpdateSecurityTool(server, deps);
  registerArchiveSecurityTool(server, deps);
  registerListSecuritiesTool(server, deps);
  registerListArchivedSecuritiesTool(server, deps);
  registerFindSecurityByTickerTool(server, deps);
  registerSearchSecuritiesTool(server, deps);
  registerImportSecurityTool(server, deps);

  registerRecordIncomeExpenseTool(server, deps);
  registerTransferBetweenAccountsTool(server, deps);
  registerUpdateTransactionTool(server, deps);
  registerDeleteTransactionTool(server, deps);
  registerListTransactionsTool(server, deps);

  registerBuySecurityTool(server, deps);
  registerSellSecurityTool(server, deps);
  registerUpdateTradeTool(server, deps);
  registerDeleteTradeTool(server, deps);
  registerListTradesTool(server, deps);

  return server;
}
