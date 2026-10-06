import { readFileSync } from "node:fs";
import path from "node:path";
import { FetchFn } from "../src/iss-client";

const fixturesDir = path.join(__dirname, "fixtures");

export function fixture(name: string): unknown {
  return JSON.parse(readFileSync(path.join(fixturesDir, name), "utf-8"));
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Serves recorded ISS responses by URL path (query string ignored); records
 * every requested URL so tests can assert on request count and params.
 */
export function createFakeFetch(routes: Record<string, string>) {
  const calls: URL[] = [];
  const fetchFn: FetchFn = async (url) => {
    const parsed = new URL(url);
    calls.push(parsed);
    // longest match wins: "/boards/TQBR/securities.json" over "/securities.json"
    const route = Object.keys(routes)
      .filter((p) => parsed.pathname.endsWith(p))
      .sort((a, b) => b.length - a.length)[0];
    if (!route) return jsonResponse({}, 404);
    return jsonResponse(fixture(routes[route]));
  };
  return { fetchFn, calls };
}
