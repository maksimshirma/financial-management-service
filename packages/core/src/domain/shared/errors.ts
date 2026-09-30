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
