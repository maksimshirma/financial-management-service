import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Clock, getBondSchedule, MarketDataProvider, SecurityRepository } from "@fms/core";

export function registerGetBondScheduleTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository; marketData: MarketDataProvider; clock: Clock },
) {
  server.registerTool(
    "get-bond-schedule",
    {
      description:
        "Upcoming coupon payments of a Moscow Exchange bond, from today on: date, amount per bond (absent while a floating coupon isn't fixed yet) and annual rate. Use it to answer 'when is the next coupon' or to check a received coupon before recording it as income.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household asking."),
        securityId: z.number().describe("The bond (from list-securities or import-security)."),
      },
    },
    async ({ householdId, securityId }) => {
      const coupons = await getBondSchedule(deps, householdId, securityId);
      return { content: [{ type: "text", text: JSON.stringify(coupons) }] };
    },
  );
}
