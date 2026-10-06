import { MarketDataUnavailableError } from "@fms/core";
import { FetchFn, IssClient, IssError, parseBlock } from "../src/iss-client";
import { jsonResponse } from "./fake-fetch";

test("parseBlock turns columns + data into objects", () => {
  const rows = parseBlock(
    { securities: { columns: ["SECID", "LAST"], data: [["SBER", 282.69]] } },
    "securities",
  );
  expect(rows).toEqual([{ SECID: "SBER", LAST: 282.69 }]);
});

test("parseBlock returns [] for a missing block", () => {
  expect(parseBlock({}, "securities")).toEqual([]);
});

test("retries 5xx and then succeeds", async () => {
  const fetchFn = jest
    .fn<ReturnType<FetchFn>, Parameters<FetchFn>>()
    .mockResolvedValueOnce(jsonResponse({}, 503))
    .mockResolvedValueOnce(jsonResponse({ ok: { columns: [], data: [] } }));
  const client = new IssClient({ fetchFn, retries: 1, retryDelayMs: 0 });

  await expect(client.get("/index")).resolves.toEqual({ ok: { columns: [], data: [] } });
  expect(fetchFn).toHaveBeenCalledTimes(2);
});

test("retries network errors and gives up with IssError", async () => {
  const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockRejectedValue(new TypeError("fetch failed"));
  const client = new IssClient({ fetchFn, retries: 2, retryDelayMs: 0 });

  const error = await client.get("/index").catch((err: unknown) => err);
  expect(error).toBeInstanceOf(IssError);
  // adapters map the core error, without depending on @fms/moex
  expect(error).toBeInstanceOf(MarketDataUnavailableError);
  expect(fetchFn).toHaveBeenCalledTimes(3);
});

test("does not retry 4xx", async () => {
  const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockResolvedValue(jsonResponse({}, 404));
  const client = new IssClient({ fetchFn, retries: 2, retryDelayMs: 0 });

  await expect(client.get("/index")).rejects.toBeInstanceOf(IssError);
  expect(fetchFn).toHaveBeenCalledTimes(1);
});

test("getAll follows the cursor until TOTAL rows are fetched", async () => {
  const page = (index: number, ids: number[]) => ({
    coupons: { columns: ["id"], data: ids.map((id) => [id]) },
    "coupons.cursor": { columns: ["INDEX", "TOTAL", "PAGESIZE"], data: [[index, 5, 2]] },
  });
  const fetchFn = jest
    .fn<ReturnType<FetchFn>, Parameters<FetchFn>>()
    .mockResolvedValueOnce(jsonResponse(page(0, [1, 2])))
    .mockResolvedValueOnce(jsonResponse(page(2, [3, 4])))
    .mockResolvedValueOnce(jsonResponse(page(4, [5])));
  const client = new IssClient({ fetchFn });

  const rows = await client.getAll("/bondization/X", "coupons");

  expect(rows.map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
  expect(fetchFn.mock.calls.map(([url]) => new URL(url).searchParams.get("start"))).toEqual([
    "0",
    "2",
    "4",
  ]);
});
