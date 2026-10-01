import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AccountRepository,
  CategoryRepository,
  Clock,
  SecurityRepository,
  TradeRepository,
  TransactionRepository,
} from "@fms/core";

import { registerArchiveAccountTool } from "./tools/accounts/archive-account";
import { registerCreateAccountTool } from "./tools/accounts/create-account";
import { registerGetAccountTool } from "./tools/accounts/get-account";
import { registerListAccountsTool } from "./tools/accounts/list-accounts";
import { registerListArchivedAccountsTool } from "./tools/accounts/list-archived-accounts";
import { registerUpdateAccountTool } from "./tools/accounts/update-account";

import { registerArchiveCategoryTool } from "./tools/categories/archive-category";
import { registerCreateCategoryTool } from "./tools/categories/create-category";
import { registerListArchivedCategoriesTool } from "./tools/categories/list-archived-categories";
import { registerListCategoriesTool } from "./tools/categories/list-categories";
import { registerUpdateCategoryTool } from "./tools/categories/update-category";

import { registerArchiveSecurityTool } from "./tools/securities/archive-security";
import { registerCreateSecurityTool } from "./tools/securities/create-security";
import { registerFindSecurityByTickerTool } from "./tools/securities/find-security-by-ticker";
import { registerListArchivedSecuritiesTool } from "./tools/securities/list-archived-securities";
import { registerListSecuritiesTool } from "./tools/securities/list-securities";
import { registerUpdateSecurityTool } from "./tools/securities/update-security";

import { registerDeleteTransactionTool } from "./tools/transactions/delete-transaction";
import { registerListTransactionsTool } from "./tools/transactions/list-transactions";
import { registerRecordIncomeExpenseTool } from "./tools/transactions/record-income-expense";
import { registerTransferBetweenAccountsTool } from "./tools/transactions/transfer-between-accounts";
import { registerUpdateTransactionTool } from "./tools/transactions/update-transaction";

import { registerBuySecurityTool } from "./tools/trades/buy-security";
import { registerDeleteTradeTool } from "./tools/trades/delete-trade";
import { registerListTradesTool } from "./tools/trades/list-trades";
import { registerSellSecurityTool } from "./tools/trades/sell-security";
import { registerUpdateTradeTool } from "./tools/trades/update-trade";

export interface ServerDeps {
  accountRepo: AccountRepository;
  categoryRepo: CategoryRepository;
  securityRepo: SecurityRepository;
  transactionRepo: TransactionRepository;
  tradeRepo: TradeRepository;
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
