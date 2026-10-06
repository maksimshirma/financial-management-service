import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MarketDataProvider, searchSecurities } from "@fms/core";

export function registerSearchSecuritiesTool(
  server: McpServer,
  deps: { marketData: MarketDataProvider },
) {
  server.registerTool(
    "search-securities",
    {
      description:
        "Search the Moscow Exchange for stocks, bonds and funds by ticker, ISIN or name (e.g. 'SBER', 'RU000A1038V6', 'ОФЗ 26238'). Returns candidates with their exchange code (secid) — pass the right one to import-security. Does not change anything.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        query: z.string().min(2).describe("Ticker, ISIN or part of the name."),
      },
    },
    async ({ query }) => {
      const candidates = await searchSecurities(deps, query);
      return { content: [{ type: "text", text: JSON.stringify(candidates) }] };
    },
  );
}
