import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CategoryRepository, updateCategory } from "@fms/core";

export function registerUpdateCategoryTool(
  server: McpServer,
  deps: { categoryRepo: CategoryRepository },
) {
  server.registerTool(
    "update-category",
    {
      description:
        "Rename an existing category. A category's type (income/expense) can't be changed after creation — create a new category if the direction needs to change.",
      inputSchema: {
        categoryId: z.number().describe("The id of the category to rename."),
        name: z.string().describe("The new name."),
      },
    },
    async (args) => {
      await updateCategory(deps, args);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
