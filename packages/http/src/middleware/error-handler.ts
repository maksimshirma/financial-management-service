import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DuplicateEntryError, InvalidTransactionError, NotFoundError } from "@fms/core";
import { TokenInvalidError } from "../auth/verify-token.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "invalid_request", issues: error.issues });
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: "not_found", message: error.message });
    return;
  }
  if (error instanceof DuplicateEntryError) {
    res.status(409).json({ error: "conflict", message: error.message });
    return;
  }
  if (error instanceof InvalidTransactionError) {
    res.status(400).json({ error: "invalid_transaction", message: error.message });
    return;
  }
  if (error instanceof TokenInvalidError) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  console.error("fms HTTP: unhandled error", error);
  if (!res.headersSent) {
    res.status(500).json({ error: "internal_error" });
  }
}
