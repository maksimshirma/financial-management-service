import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSecurityQuote, MarketDataProvider, SecurityRepository } from "@fms/core";

export function registerGetSecurityQuoteTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository; marketData: MarketDataProvider },
) {
  server.registerTool(
    "get-security-quote",
    {
      description:
        "Current Moscow Exchange price of a security (delayed up to 15 minutes). Bonds are quoted as a percent of face value (priceUnit 'percent_of_face') with accruedInterest per bond in currency; stocks and funds in currency. Not available for hand-entered securities.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household asking."),
        securityId: z.number().describe("The security to quote (from list-securities or import-security)."),
      },
    },
    async ({ householdId, securityId }) => {
      const quote = await getSecurityQuote(deps, householdId, securityId);
      return { content: [{ type: "text", text: JSON.stringify(quote) }] };
    },
  );
}
