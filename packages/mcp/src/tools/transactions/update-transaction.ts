import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AccountRepository,
  CategoryRepository,
  SecurityRepository,
  TransactionRepository,
  updateTransaction,
} from "@fms/core";

export function registerUpdateTransactionTool(
  server: McpServer,
  deps: {
    transactionRepo: TransactionRepository;
    accountRepo: AccountRepository;
    categoryRepo: CategoryRepository;
    securityRepo: SecurityRepository;
  },
) {
  server.registerTool(
    "update-transaction",
    {
      description:
        "Correct one or more fields on an existing transaction. Only the fields provided are changed.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        householdId: z.string().describe("The id of the household acting; only its own accounts, categories and securities can be used."),
        transactionId: z.number().describe("The id of the transaction to update."),
        date: z.coerce.date().optional().describe("New transaction date, replacing the current one."),
        amount: z.number().optional().describe("New amount, replacing the current one."),
        categoryId: z.number().optional().describe("New category id, replacing the current one."),
        toAccountId: z
          .number()
          .optional()
          .describe("New destination account id, for transfers only."),
        toAmount: z.number().optional().describe("New destination amount, for transfers only."),
        securityId: z
          .number()
          .optional()
          .describe("New related security id, for dividend/coupon transactions only."),
        note: z.string().optional().describe("New free-text note, replacing the current one."),
      },
    },
    async (args) => {
      await updateTransaction(deps, args);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
