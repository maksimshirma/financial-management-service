import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AccountRepository,
  deleteTransaction,
  TransactionRepository,
} from "@fms/core";

export function registerDeleteTransactionTool(
  server: McpServer,
  deps: { transactionRepo: TransactionRepository; accountRepo: AccountRepository },
) {
  server.registerTool(
    "delete-transaction",
    {
      description:
        "Permanently delete a transaction, e.g. to remove a mistaken entry. Unlike accounts/categories/securities, transactions have no archive — this is a hard delete.",
      annotations: { readOnlyHint: false, destructiveHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household acting; only its own accounts, categories and securities can be used."),
        transactionId: z.number().describe("The id of the transaction to delete."),
      },
    },
    async ({ householdId, transactionId }) => {
      await deleteTransaction(deps, householdId, transactionId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
