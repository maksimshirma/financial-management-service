import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AccountRepository,
  CategoryRepository,
  Clock,
  recordIncomeExpense,
  TransactionRepository,
} from "@fms/core";

export function registerRecordIncomeExpenseTool(
  server: McpServer,
  deps: {
    transactionRepo: TransactionRepository;
    accountRepo: AccountRepository;
    categoryRepo: CategoryRepository;
    clock: Clock;
  },
) {
  server.registerTool(
    "record-income-expense",
    {
      description:
        "Record a single income or expense transaction on an account (salary, groceries, a dividend or coupon payment, etc). The amount is always positive — whether it counts as income or expense is determined entirely by the category. For dividends/coupons, use an income category and mention the security in the note.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        householdId: z.string().describe("The id of the household acting; only its own accounts, categories and securities can be used."),
        accountId: z.number().describe("The account money was received into or spent from."),
        amount: z.number().describe("The transaction amount, always positive, in the account's currency."),
        categoryId: z
          .number()
          .describe(
            "The category classifying this transaction (from list-categories) — its type determines income vs expense.",
          ),
        date: z.coerce.date().optional().describe("The transaction date. Defaults to today if omitted."),
        note: z.string().optional().describe("Free-text note, e.g. 'Groceries at the supermarket'."),
      },
    },
    async (args) => {
      const transaction = await recordIncomeExpense(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(transaction) }] };
    },
  );
}
