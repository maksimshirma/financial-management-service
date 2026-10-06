import type { NextFunction, Request, Response } from "express";

/** Gate for household-scoped routers (accounts, categories) — securities/transactions/trades don't need this. */
export function requireHousehold(req: Request, res: Response, next: NextFunction) {
  if (!req.auth.hid) {
    res.status(403).json({ error: "forbidden", message: "token has no household" });
    return;
  }
  next();
}
