import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buySecurity, Clock, TradeRepository } from "@fms/core";

export function registerBuySecurityTool(
  server: McpServer,
  deps: { tradeRepo: TradeRepository; clock: Clock },
) {
  server.registerTool(
    "buy-security",
    {
      description:
        "Record the purchase of a security on a brokerage account. This only records the trade — it does not separately record the cash movement as a transaction.",
      inputSchema: {
        accountId: z.number().describe("The brokerage account the security was bought into."),
        securityId: z
          .number()
          .describe("The security being bought (from list-securities or find-security-by-ticker)."),
        quantity: z.number().describe("Number of units/shares purchased."),
        price: z.number().describe("Price paid per unit, in the security's currency."),
        accruedInterest: z
          .number()
          .optional()
          .describe("Accrued interest paid as part of a bond purchase, if applicable. Defaults to 0."),
        fee: z.number().optional().describe("Broker commission for this trade. Defaults to 0."),
        date: z.coerce.date().optional().describe("Trade date. Defaults to today if omitted."),
      },
    },
    async (args) => {
      const trade = await buySecurity(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(trade) }] };
    },
  );
}
