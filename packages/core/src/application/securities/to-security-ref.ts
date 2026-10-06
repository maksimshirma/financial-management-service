import { SecuritiesTable } from "../../domain/index.js";
import { SecurityRef } from "../ports/index.js";

/** null for securities the exchange can't quote (hand-entered, or never imported) */
export function toSecurityRef(security: SecuritiesTable): SecurityRef | null {
  if (!security.board_id || !security.market) return null;
  return { secid: security.ticker, boardId: security.board_id, market: security.market };
}
