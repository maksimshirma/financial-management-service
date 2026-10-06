import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SecurityRepository, updateSecurity } from "@fms/core";

export function registerUpdateSecurityTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository },
) {
  server.registerTool(
    "update-security",
    {
      description:
        "Update a hand-entered (non-MOEX) security's mutable fields. Securities imported from the exchange can't be edited — their data comes from MOEX. The ticker, isin, type, and currency identify the instrument and can't be changed — create a new security if those are wrong.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        householdId: z.string().describe("The id of the household that owns the security."),
        securityId: z.number().describe("The id of the security to update."),
        name: z.string().optional().describe("New name, replacing the current one."),
        faceValue: z
          .number()
          .optional()
          .describe("New bond face value, replacing the current one. Only meaningful for bonds."),
        couponRate: z
          .number()
          .optional()
          .describe("New bond coupon rate, replacing the current one. Only meaningful for bonds."),
        maturityDate: z
          .coerce.date()
          .optional()
          .describe("New bond maturity date, replacing the current one. Only meaningful for bonds."),
      },
    },
    async (args) => {
      await updateSecurity(deps, args);
      return { content: [{ type: "text", text: "OK" }] };
    },
  );
}
