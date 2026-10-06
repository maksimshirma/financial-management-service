import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listArchivedSecurities, SecurityRepository } from "@fms/core";

export function registerListArchivedSecuritiesTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository },
) {
  server.registerTool(
    "list-archived-securities",
    {
      description: "List the securities the household has archived.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household whose archived securities to list."),
      },
    },
    async ({ householdId }) => {
      const securities = await listArchivedSecurities(deps, householdId);
      return { content: [{ type: "text", text: JSON.stringify(securities) }] };
    },
  );
}
