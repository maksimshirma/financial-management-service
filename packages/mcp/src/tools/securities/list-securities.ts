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
        "List active (non-archived) securities. Use this, or find-security-by-ticker, to find a securityId before recording a trade.",
      inputSchema: {},
    },
    async () => {
      const securities = await listSecurities(deps);
      return { content: [{ type: "text", text: JSON.stringify(securities) }] };
    },
  );
}
