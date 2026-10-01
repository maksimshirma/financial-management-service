import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { deleteTrade, TradeRepository } from "@fms/core";

export function registerDeleteTradeTool(
  server: McpServer,
  deps: { tradeRepo: TradeRepository },
) {
  server.registerTool(
    "delete-trade",
    {
      description: "Permanently delete a trade, e.g. to remove a mistaken entry.",
      inputSchema: {
        tradeId: z.number().describe("The id of the trade to delete."),
      },
    },
    async ({ tradeId }) => {
      await deleteTrade(deps, tradeId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
