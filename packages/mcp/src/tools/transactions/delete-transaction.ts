import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { deleteTransaction, TransactionRepository } from "@fms/core";

export function registerDeleteTransactionTool(
  server: McpServer,
  deps: { transactionRepo: TransactionRepository },
) {
  server.registerTool(
    "delete-transaction",
    {
      description:
        "Permanently delete a transaction, e.g. to remove a mistaken entry. Unlike accounts/categories/securities, transactions have no archive — this is a hard delete.",
      annotations: { readOnlyHint: false, destructiveHint: true },
      inputSchema: {
        transactionId: z.number().describe("The id of the transaction to delete."),
      },
    },
    async ({ transactionId }) => {
      await deleteTransaction(deps, transactionId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
