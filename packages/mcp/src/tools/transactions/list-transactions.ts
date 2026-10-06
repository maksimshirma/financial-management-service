import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listTransactions, TransactionRepository } from "@fms/core";

export function registerListTransactionsTool(
  server: McpServer,
  deps: { transactionRepo: TransactionRepository },
) {
  server.registerTool(
    "list-transactions",
    {
      description:
        "List the household's transactions (on its own accounts), optionally narrowed by account and/or date range. Filters combine with AND. Omit all filters to list everything.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household acting; only its own accounts, categories and securities can be used."),
        accountId: z.number().optional().describe("Only return transactions on this account."),
        from: z.coerce.date().optional().describe("Only return transactions on or after this date."),
        to: z.coerce.date().optional().describe("Only return transactions on or before this date."),
      },
    },
    async ({ householdId, ...filter }) => {
      const transactions = await listTransactions(deps, householdId, filter);
      return { content: [{ type: "text", text: JSON.stringify(transactions) }] };
    },
  );
}
