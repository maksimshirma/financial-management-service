import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listArchivedSecurities, SecurityRepository } from "@fms/core";

export function registerListArchivedSecuritiesTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository },
) {
  server.registerTool(
    "list-archived-securities",
    {
      description: "List archived securities.",
      annotations: { readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const securities = await listArchivedSecurities(deps);
      return { content: [{ type: "text", text: JSON.stringify(securities) }] };
    },
  );
}
