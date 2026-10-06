import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CategoryRepository, CategoryType, createCategory } from "@fms/core";

export function registerCreateCategoryTool(
  server: McpServer,
  deps: { categoryRepo: CategoryRepository },
) {
  server.registerTool(
    "create-category",
    {
      description:
        "Create a new category for classifying income or expense transactions (e.g. 'Groceries', 'Salary'). Category names must be unique within the household.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        householdId: z.string().describe("The id of the household that owns this category."),
        name: z.string().describe("A human-readable category name, unique within the household."),
        type: z
          .nativeEnum(CategoryType)
          .describe(
            "Whether transactions in this category represent income (money coming in) or expense (money going out).",
          ),
      },
    },
    async (args) => {
      const category = await createCategory(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(category) }] };
    },
  );
}
