import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountRepository, AccountType, Currency, updateAccount } from "@fms/core";

export function registerUpdateAccountTool(
  server: McpServer,
  deps: { accountRepo: AccountRepository },
) {
  server.registerTool(
    "update-account",
    {
      description:
        "Change an existing account's name, type, or currency. Only the fields provided are changed; omitted fields keep their current value.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        accountId: z
          .number()
          .describe("The id of the account to update (from list-accounts or create-account)."),
        name: z.string().optional().describe("New name, replacing the current one."),
        type: z
          .nativeEnum(AccountType)
          .optional()
          .describe("New account type, replacing the current one."),
        currency: z
          .nativeEnum(Currency)
          .optional()
          .describe("New currency, replacing the current one."),
      },
    },
    async (args) => {
      await updateAccount(deps, args);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
