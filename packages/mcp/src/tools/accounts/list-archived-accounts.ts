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
        "List a household's archived accounts. Archived accounts are excluded from list-accounts but their history is preserved.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household whose archived accounts to list."),
      },
    },
    async ({ householdId }) => {
      const accounts = await listArchivedAccounts(deps, householdId);
      return { content: [{ type: "text", text: JSON.stringify(accounts) }] };
    },
  );
}
