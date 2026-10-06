import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountRepository, AccountType, createAccount, Currency } from "@fms/core";

export function registerCreateAccountTool(
  server: McpServer,
  deps: { accountRepo: AccountRepository },
) {
  server.registerTool(
    "create-account",
    {
      description:
        "Create a new financial account for a household (e.g. a bank account, cash wallet, credit card, or brokerage account). Returns the created account including its generated id.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        householdId: z.string().describe("The id of the household that owns this account."),
        name: z
          .string()
          .describe(
            "A human-readable name for the account, unique per household (e.g. 'Tinkoff Checking', 'Cash').",
          ),
        type: z
          .nativeEnum(AccountType)
          .describe(
            "The kind of account: cash (physical cash), card (debit card), deposit (savings/deposit account), credit (credit card or loan), broker (brokerage/investment account).",
          ),
        currency: z
          .nativeEnum(Currency)
          .describe(
            "The currency this account holds balances in. All transactions and trades recorded against this account are in this currency.",
          ),
      },
    },
    async (args) => {
      const account = await createAccount(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(account) }] };
    },
  );
}
