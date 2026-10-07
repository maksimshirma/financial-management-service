export class NotFoundError extends Error {
  constructor(entity: string, id: number | string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class DuplicateEntryError extends Error {
  constructor(entity: string, field: string, value: number | string) {
    super(`${entity} already exists with ${field}: ${value}`);
    this.name = "DuplicateEntryError";
  }
}

export class InvalidTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransactionError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** The exchange / market data source couldn't be reached or answered with an error. */
export class MarketDataUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketDataUnavailableError";
  }
}
