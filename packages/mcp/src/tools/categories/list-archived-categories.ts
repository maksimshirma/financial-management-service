import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CategoryRepository, listArchivedCategories } from "@fms/core";

export function registerListArchivedCategoriesTool(
  server: McpServer,
  deps: { categoryRepo: CategoryRepository },
) {
  server.registerTool(
    "list-archived-categories",
    {
      description: "List a household's archived categories.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household whose archived categories to list."),
      },
    },
    async ({ householdId }) => {
      const categories = await listArchivedCategories(deps, householdId);
      return { content: [{ type: "text", text: JSON.stringify(categories) }] };
    },
  );
}
