import { z } from "zod";
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
        "List a household's active (non-archived) income/expense categories. Use this to find a categoryId before recording a transaction.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        householdId: z.string().describe("The id of the household whose categories to list."),
      },
    },
    async ({ householdId }) => {
      const categories = await listCategories(deps, householdId);
      return { content: [{ type: "text", text: JSON.stringify(categories) }] };
    },
  );
}
