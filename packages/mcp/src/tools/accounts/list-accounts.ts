import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountRepository, listAccounts } from "@fms/core";

export function registerListAccountsTool(
  server: McpServer,
  deps: { accountRepo: AccountRepository },
) {
  server.registerTool(
    "list-accounts",
    {
      description:
        "List a user's active (non-archived) accounts. Use this to find an account's id before recording a transaction or trade against it.",
      inputSchema: {
        userId: z.number().describe("The id of the user whose accounts to list."),
      },
    },
    async ({ userId }) => {
      const accounts = await listAccounts(deps, userId);
      return { content: [{ type: "text", text: JSON.stringify(accounts) }] };
    },
  );
}
