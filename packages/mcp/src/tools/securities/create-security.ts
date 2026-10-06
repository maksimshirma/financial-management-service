import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createSecurity, Currency, SecurityRepository, SecurityType } from "@fms/core";

export function registerCreateSecurityTool(
  server: McpServer,
  deps: { securityRepo: SecurityRepository },
) {
  server.registerTool(
    "create-security",
    {
      description:
        "Add a new security (stock, bond, or fund) to the reference list so it can be bought, sold, or referenced by dividend/coupon transactions. Bond-only fields (faceValue, couponRate, maturityDate) are ignored for stocks and funds.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        ticker: z.string().describe("Exchange ticker symbol, e.g. 'SBER', 'AAPL'. Must be unique."),
        isin: z
          .string()
          .optional()
          .describe(
            "International Securities Identification Number, e.g. 'RU0009029540'. Optional, but unique if given.",
          ),
        name: z.string().describe("Human-readable name, e.g. 'Sberbank'."),
        type: z.nativeEnum(SecurityType).describe("stock, bond, or fund."),
        currency: z.nativeEnum(Currency).describe("The currency this security is priced/traded in."),
        faceValue: z
          .number()
          .optional()
          .describe("Bond face (nominal) value. Only meaningful for bonds."),
        couponRate: z
          .number()
          .optional()
          .describe("Bond annual coupon rate as a percent, e.g. 7.1 for 7.1%. Only meaningful for bonds."),
        maturityDate: z
          .coerce.date()
          .optional()
          .describe("Bond maturity date. Only meaningful for bonds."),
      },
    },
    async (args) => {
      const security = await createSecurity(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(security) }] };
    },
  );
}
