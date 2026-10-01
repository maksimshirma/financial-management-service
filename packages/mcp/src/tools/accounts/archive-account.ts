import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountRepository, archiveAccount } from "@fms/core";

export function registerArchiveAccountTool(
  server: McpServer,
  deps: { accountRepo: AccountRepository },
) {
  server.registerTool(
    "archive-account",
    {
      description:
        "Archive an account, hiding it from the active account list while preserving its full transaction history. There is no hard-delete for accounts — use this for a closed or unused account.",
      inputSchema: {
        accountId: z.number().describe("The id of the account to archive."),
      },
    },
    async ({ accountId }) => {
      await archiveAccount(deps, accountId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
