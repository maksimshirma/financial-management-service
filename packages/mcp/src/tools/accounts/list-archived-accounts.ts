import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountRepository, listArchivedAccounts } from "@fms/core";

export function registerListArchivedAccountsTool(
  server: McpServer,
  deps: { accountRepo: AccountRepository },
) {
  server.registerTool(
    "list-archived-accounts",
    {
      description:
        "List a user's archived accounts. Archived accounts are excluded from list-accounts but their history is preserved.",
      inputSchema: {
        userId: z.number().describe("The id of the user whose archived accounts to list."),
      },
    },
    async ({ userId }) => {
      const accounts = await listArchivedAccounts(deps, userId);
      return { content: [{ type: "text", text: JSON.stringify(accounts) }] };
    },
  );
}
