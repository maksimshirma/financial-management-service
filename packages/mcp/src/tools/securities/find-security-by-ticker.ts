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
        "Look up a single security by its exact ticker symbol (e.g. 'SBER'). Returns 'Not found' if none is registered — use create-security to add it first.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        ticker: z.string().describe("The exact ticker symbol to search for."),
      },
    },
    async ({ ticker }) => {
      const security = await findSecurityByTicker(deps, ticker);
      if (security === null) {
        return { content: [{ type: "text", text: "Not found" }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(security) }] };
    },
  );
}
