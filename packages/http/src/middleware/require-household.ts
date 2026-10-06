import type { NextFunction, Request, Response } from "express";

/** Gate for every data router — all of them act on the token's household. */
export function requireHousehold(req: Request, res: Response, next: NextFunction) {
  if (!req.auth.hid) {
    res.status(403).json({ error: "forbidden", message: "token has no household" });
    return;
  }
  next();
}
