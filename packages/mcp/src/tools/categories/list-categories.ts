import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CategoryRepository, listCategories } from "@fms/core";

export function registerListCategoriesTool(
  server: McpServer,
  deps: { categoryRepo: CategoryRepository },
) {
  server.registerTool(
    "list-categories",
    {
      description:
        "List active (non-archived) income/expense categories. Use this to find a categoryId before recording a transaction.",
      annotations: { readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const categories = await listCategories(deps);
      return { content: [{ type: "text", text: JSON.stringify(categories) }] };
    },
  );
}
