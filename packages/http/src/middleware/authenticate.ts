import type { NextFunction, Request, Response } from "express";
import type { JWTVerifyGetKey } from "jose";
import { TokenInvalidError, verifyInternalJwt } from "../auth/verify-token.js";

export function authenticate(jwks: JWTVerifyGetKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Internal ")) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const token = header.slice("Internal ".length);
    try {
      req.auth = await verifyInternalJwt(token, jwks);
      next();
    } catch (err) {
      if (err instanceof TokenInvalidError) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      next(err);
    }
  };
}
