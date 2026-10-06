import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { archiveSecurity, SecurityRepository } from "@fms/core";

export function registerArchiveSecurityTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository },
) {
  server.registerTool(
    "archive-security",
    {
      description:
        "Hide a security from the household's active list while preserving trade/dividend history. Affects only this household. Importing or trading the security again brings it back.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        householdId: z.string().describe("The id of the household archiving the security."),
        securityId: z.number().describe("The id of the security to archive."),
      },
    },
    async ({ householdId, securityId }) => {
      await archiveSecurity(deps, householdId, securityId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
