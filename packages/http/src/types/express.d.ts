import type { InternalJwtClaims } from "../auth/verify-token.js";

declare global {
  namespace Express {
    interface Request {
      auth: InternalJwtClaims;
    }
  }
}

export {};
