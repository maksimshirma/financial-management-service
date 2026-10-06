import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Clock, TransactionRepository, transferBetweenAccounts } from "@fms/core";

export function registerTransferBetweenAccountsTool(
  server: McpServer,
  deps: { transactionRepo: TransactionRepository; clock: Clock },
) {
  server.registerTool(
    "transfer-between-accounts",
    {
      description:
        "Move money from one of the user's own accounts to another (e.g. topping up a brokerage account from a checking account). Not for paying external parties — use record-income-expense with an expense category for that.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        accountId: z.number().describe("The source account money is taken from."),
        toAccountId: z
          .number()
          .describe("The destination account money is sent to. Must be different from accountId."),
        amount: z.number().describe("Amount deducted from the source account, in the source account's currency."),
        toAmount: z
          .number()
          .optional()
          .describe(
            "Amount credited to the destination account. Only needed if the two accounts use different currencies — otherwise it equals amount.",
          ),
        date: z.coerce.date().optional().describe("The transfer date. Defaults to today if omitted."),
        note: z.string().optional().describe("Free-text note."),
      },
    },
    async (args) => {
      const transaction = await transferBetweenAccounts(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(transaction) }] };
    },
  );
}
