import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getPortfolioValue,
  MarketDataProvider,
  SecurityRepository,
  TradeRepository,
} from "@fms/core";

export function registerGetPortfolioValueTool(
  server: McpServer,
  deps: {
    tradeRepo: TradeRepository;
    securityRepo: SecurityRepository;
    marketData: MarketDataProvider;
  },
) {
  server.registerTool(
    "get-portfolio-value",
    {
      description:
        "Open positions (net of buys and sells) across all of the household's accounts, valued at current Moscow Exchange prices (delayed up to 15 minutes), with totals per currency. Bonds are valued at percent of face value plus accrued interest. Positions that can't be priced (hand-entered securities, exchange unavailable) are listed in 'unpriced' and left out of the totals.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household whose portfolio to value."),
      },
    },
    async ({ householdId }) => {
      const portfolio = await getPortfolioValue(deps, householdId);
      return { content: [{ type: "text", text: JSON.stringify(portfolio) }] };
    },
  );
}
