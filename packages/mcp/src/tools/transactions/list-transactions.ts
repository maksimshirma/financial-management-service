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
        "List transactions, optionally narrowed by account and/or date range. Filters combine with AND. Omit all filters to list everything.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        accountId: z.number().optional().describe("Only return transactions on this account."),
        from: z.coerce.date().optional().describe("Only return transactions on or after this date."),
        to: z.coerce.date().optional().describe("Only return transactions on or before this date."),
      },
    },
    async (args) => {
      const transactions = await listTransactions(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(transactions) }] };
    },
  );
}
