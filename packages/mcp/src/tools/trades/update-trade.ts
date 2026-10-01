import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TradeRepository, updateTrade } from "@fms/core";

export function registerUpdateTradeTool(
  server: McpServer,
  deps: { tradeRepo: TradeRepository },
) {
  server.registerTool(
    "update-trade",
    {
      description:
        "Correct one or more fields on an existing trade. The account and security a trade belongs to can't be changed — delete and re-create the trade if those are wrong.",
      inputSchema: {
        tradeId: z.number().describe("The id of the trade to update."),
        date: z.coerce.date().optional().describe("New trade date, replacing the current one."),
        quantity: z.number().optional().describe("New quantity, replacing the current one."),
        price: z.number().optional().describe("New price per unit, replacing the current one."),
        accruedInterest: z.number().optional().describe("New accrued interest, replacing the current one."),
        fee: z.number().optional().describe("New broker commission, replacing the current one."),
      },
    },
    async (args) => {
      await updateTrade(deps, args);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
