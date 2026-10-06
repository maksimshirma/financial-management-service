import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CategoryRepository, listArchivedCategories } from "@fms/core";

export function registerListArchivedCategoriesTool(
  server: McpServer,
  deps: { categoryRepo: CategoryRepository },
) {
  server.registerTool(
    "list-archived-categories",
    {
      description: "List archived categories.",
      annotations: { readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const categories = await listArchivedCategories(deps);
      return { content: [{ type: "text", text: JSON.stringify(categories) }] };
    },
  );
}
