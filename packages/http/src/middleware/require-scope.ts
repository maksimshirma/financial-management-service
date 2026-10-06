import type { NextFunction, Request, Response } from "express";
import { hasScope, type ScopeLevel } from "../auth/scope.js";

export function requireScope(level: ScopeLevel) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasScope(req.auth.scope, level)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  };
}
