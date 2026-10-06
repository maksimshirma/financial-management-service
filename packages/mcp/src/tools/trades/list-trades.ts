import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listTrades, TradeRepository } from "@fms/core";

export function registerListTradesTool(
  server: McpServer,
  deps: { tradeRepo: TradeRepository },
) {
  server.registerTool(
    "list-trades",
    {
      description:
        "List the household's trades (on its own accounts), optionally narrowed by account, security, and/or date range. Filters combine with AND. Omit all filters to list everything.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household acting; only its own accounts, categories and securities can be used."),
        accountId: z.number().optional().describe("Only return trades on this account."),
        securityId: z.number().optional().describe("Only return trades in this security."),
        from: z.coerce.date().optional().describe("Only return trades on or after this date."),
        to: z.coerce.date().optional().describe("Only return trades on or before this date."),
      },
    },
    async ({ householdId, ...filter }) => {
      const trades = await listTrades(deps, householdId, filter);
      return { content: [{ type: "text", text: JSON.stringify(trades) }] };
    },
  );
}
