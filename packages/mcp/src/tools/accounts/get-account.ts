import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountRepository, getAccount } from "@fms/core";

export function registerGetAccountTool(
  server: McpServer,
  deps: { accountRepo: AccountRepository },
) {
  server.registerTool(
    "get-account",
    {
      description:
        "Fetch a single account by its id. Returns 'Not found' if no account with that id exists.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        accountId: z.number().describe("The id of the account to fetch."),
      },
    },
    async ({ accountId }) => {
      const account = await getAccount(deps, accountId);
      if (account === null) {
        return { content: [{ type: "text", text: "Not found" }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(account) }] };
    },
  );
}
