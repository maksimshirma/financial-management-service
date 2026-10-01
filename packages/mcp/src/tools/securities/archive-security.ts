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
        "Archive a security, hiding it from the active list while preserving trade/dividend history. There is no hard-delete for securities.",
      inputSchema: {
        securityId: z.number().describe("The id of the security to archive."),
      },
    },
    async ({ securityId }) => {
      await archiveSecurity(deps, securityId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
