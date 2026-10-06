import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AccountRepository,
  deleteTrade,
  TradeRepository,
} from "@fms/core";

export function registerDeleteTradeTool(
  server: McpServer,
  deps: { tradeRepo: TradeRepository; accountRepo: AccountRepository },
) {
  server.registerTool(
    "delete-trade",
    {
      description: "Permanently delete a trade, e.g. to remove a mistaken entry.",
      annotations: { readOnlyHint: false, destructiveHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household acting; only its own accounts, categories and securities can be used."),
        tradeId: z.number().describe("The id of the trade to delete."),
      },
    },
    async ({ householdId, tradeId }) => {
      await deleteTrade(deps, householdId, tradeId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
