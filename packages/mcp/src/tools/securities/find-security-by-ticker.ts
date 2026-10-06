import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findSecurityByTicker, SecurityRepository } from "@fms/core";

export function registerFindSecurityByTickerTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository },
) {
  server.registerTool(
    "find-security-by-ticker",
    {
      description:
        "Look up a single already-registered security by its exact ticker (for MOEX securities — the exchange code, e.g. 'SBER', 'SU26238RMFS4'). Returns 'Not found' if none is registered — then use search-securities and import-security.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household looking the security up."),
        ticker: z.string().describe("The exact ticker to search for."),
      },
    },
    async ({ householdId, ticker }) => {
      const security = await findSecurityByTicker(deps, householdId, ticker);
      if (security === null) {
        return { content: [{ type: "text", text: "Not found" }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(security) }] };
    },
  );
}
