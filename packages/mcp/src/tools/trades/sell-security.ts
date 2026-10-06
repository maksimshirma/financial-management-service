import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AccountRepository,
  Clock,
  sellSecurity,
  SecurityRepository,
  TradeRepository,
} from "@fms/core";

export function registerSellSecurityTool(
  server: McpServer,
  deps: {
    tradeRepo: TradeRepository;
    accountRepo: AccountRepository;
    securityRepo: SecurityRepository;
    clock: Clock;
  },
) {
  server.registerTool(
    "sell-security",
    {
      description:
        "Record the sale of a security on a brokerage account. The system does not check whether the account actually holds enough of the security to sell — that's the caller's responsibility.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        householdId: z.string().describe("The id of the household acting; only its own accounts, categories and securities can be used."),
        accountId: z.number().describe("The brokerage account the security was sold from."),
        securityId: z
          .number()
          .describe("The security being sold (from list-securities, find-security-by-ticker or import-security)."),
        quantity: z.number().describe("Number of units/shares sold."),
        price: z.number().describe("Price received per unit, in the security's currency."),
        accruedInterest: z
          .number()
          .optional()
          .describe("Accrued interest received as part of a bond sale, if applicable. Defaults to 0."),
        fee: z.number().optional().describe("Broker commission for this trade. Defaults to 0."),
        date: z.coerce.date().optional().describe("Trade date. Defaults to today if omitted."),
      },
    },
    async (args) => {
      const trade = await sellSecurity(deps, args);
      return { content: [{ type: "text", text: JSON.stringify(trade) }] };
    },
  );
}
