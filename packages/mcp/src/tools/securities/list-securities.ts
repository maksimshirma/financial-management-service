import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listSecurities, SecurityRepository } from "@fms/core";

export function registerListSecuritiesTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository },
) {
  server.registerTool(
    "list-securities",
    {
      description:
        "List the household's active (non-archived) securities — those it imported, created or traded. Use this, or find-security-by-ticker, to find a securityId before recording a trade. If the security isn't here, use search-securities and import-security.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household whose securities to list."),
      },
    },
    async ({ householdId }) => {
      const securities = await listSecurities(deps, householdId);
      return { content: [{ type: "text", text: JSON.stringify(securities) }] };
    },
  );
}
