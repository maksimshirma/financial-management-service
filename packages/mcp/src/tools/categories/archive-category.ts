import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { archiveCategory, CategoryRepository } from "@fms/core";

export function registerArchiveCategoryTool(
  server: McpServer,
  deps: { categoryRepo: CategoryRepository },
) {
  server.registerTool(
    "archive-category",
    {
      description:
        "Archive a category, hiding it from the active list while preserving the history of transactions that reference it. There is no hard-delete for categories.",
      inputSchema: {
        categoryId: z.number().describe("The id of the category to archive."),
      },
    },
    async ({ categoryId }) => {
      await archiveCategory(deps, categoryId);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
