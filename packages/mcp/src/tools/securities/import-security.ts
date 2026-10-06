import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Clock, importSecurity, MarketDataProvider, SecurityRepository } from "@fms/core";

export function registerImportSecurityTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository; marketData: MarketDataProvider; clock: Clock },
) {
  server.registerTool(
    "import-security",
    {
      description:
        "Add a Moscow Exchange security to the household's list, with reference data (ISIN, name, type, currency, face value, coupon, maturity) taken from the exchange. Safe to repeat — refreshes the data and un-archives it. Returns the security with its securityId for trades. Get the secid from search-securities.",
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household adding the security."),
        secid: z.string().describe("Exchange security code from search-securities, e.g. 'SU26238RMFS4'."),
      },
    },
    async (args) => {
      const security = await importSecurity(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(security) }] };
    },
  );
}
