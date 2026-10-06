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
        "List a household's active (non-archived) accounts. Use this to find an account's id before recording a transaction or trade against it.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household whose accounts to list."),
      },
    },
    async ({ householdId }) => {
      const accounts = await listAccounts(deps, householdId);
      return { content: [{ type: "text", text: JSON.stringify(accounts) }] };
    },
  );
}
