import { MarketDataUnavailableError } from "@fms/core";

export type FetchFn = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

export interface IssClientOptions {
  baseUrl?: string;
  fetchFn?: FetchFn;
  timeoutMs?: number;
  /** extra attempts after the first one, on network errors and 5xx */
  retries?: number;
  retryDelayMs?: number;
}

type Row = Record<string, unknown>;
type IssBlock = { columns: string[]; data: unknown[][] };
type IssResponse = Record<string, IssBlock | undefined>;

/** ISS-specific failure; adapters only need to know the core error it extends. */
export class IssError extends MarketDataUnavailableError {
  constructor(message: string) {
    super(message);
    this.name = "IssError";
  }
}

// ISS answers every request with named blocks of `columns` + `data` (rows as
// arrays) — turn one block into plain objects keyed by column name.
export function parseBlock(json: IssResponse, name: string): Row[] {
  const block = json[name];
  if (!block) return [];
  return block.data.map((values) =>
    Object.fromEntries(block.columns.map((column, i) => [column, values[i]])),
  );
}

/** Thin HTTP client for the MOEX Informational & Statistical Server. */
export class IssClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryDelayMs: number;

  constructor(options: IssClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://iss.moex.com/iss";
    this.fetchFn = options.fetchFn ?? ((url, init) => fetch(url, init));
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.retries = options.retries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 500;
  }

  /** @throws {IssError} request failed after all retries */
  async get(path: string, params: Record<string, string | number> = {}): Promise<IssResponse> {
    const query = new URLSearchParams({ "iss.meta": "off" });
    for (const [key, value] of Object.entries(params)) query.set(key, String(value));
    const url = `${this.baseUrl}${path}.json?${query}`;

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      if (attempt > 0) await sleep(this.retryDelayMs * 2 ** (attempt - 1));
      try {
        const response = await this.fetchFn(url, {
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        // the docs ask to retry 500–504 a bit later; anything else won't improve
        if (response.status >= 500) {
          lastError = new IssError(`ISS ${response.status} for ${url}`);
          continue;
        }
        if (!response.ok) throw new IssError(`ISS ${response.status} for ${url}`);
        return (await response.json()) as IssResponse;
      } catch (err) {
        if (err instanceof IssError) throw err;
        lastError = err;
      }
    }
    throw new IssError(`ISS request failed: ${url} (${String(lastError)})`);
  }

  /** Follows the `<block>.cursor` pagination until every row of `block` is fetched. */
  async getAll(
    path: string,
    block: string,
    params: Record<string, string | number> = {},
  ): Promise<Row[]> {
    const rows: Row[] = [];
    let start = 0;
    for (;;) {
      const json = await this.get(path, {
        ...params,
        "iss.only": `${block},${block}.cursor`,
        start,
      });
      const page = parseBlock(json, block);
      rows.push(...page);

      const [cursor] = parseBlock(json, `${block}.cursor`);
      if (!cursor || page.length === 0) return rows;
      const index = Number(cursor.INDEX);
      const pageSize = Number(cursor.PAGESIZE);
      if (index + pageSize >= Number(cursor.TOTAL)) return rows;
      start = index + pageSize;
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
