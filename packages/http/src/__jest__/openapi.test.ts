import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createLocalJWKSet } from "jose";
import { routeSpecs } from "../dto/openapi";
import { createRouters, createServer, type ServerDeps } from "../server";

// routers only close over deps — nothing is called while listing routes or serving the docs
const deps = {} as ServerDeps;

function expressRoutes(): string[] {
  return Object.entries(createRouters(deps)).flatMap(([prefix, router]) =>
    router.stack.flatMap((layer) => {
      const route = layer.route as { path: string; methods: Record<string, boolean> } | undefined;
      if (!route) return [];
      // "/:securityId/quote" → "/securities/{securityId}/quote"; "/" → "/securities"
      const path = (prefix + route.path.replace(/:(\w+)/g, "{$1}")).replace(/\/$/, "");
      return Object.keys(route.methods).map((method) => `${method.toUpperCase()} ${path}`);
    }),
  );
}

test("every Express route is described in the OpenAPI document, and nothing else", () => {
  const documented = routeSpecs.map((spec) => `${spec.method.toUpperCase()} ${spec.path}`);

  expect([...expressRoutes()].sort()).toEqual([...documented].sort());
});

describe("served documentation", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(() => {
    const app = createServer(deps, { jwks: createLocalJWKSet({ keys: [] }) });
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    server.close();
  });

  it("serves /openapi.json without a token", async () => {
    const res = await fetch(`${baseUrl}/openapi.json`);
    const doc = await res.json();

    expect(res.status).toBe(200);
    expect(doc.openapi).toBe("3.0.3");
    expect(doc.paths["/securities/{securityId}/quote"].get.responses).toHaveProperty("503");
    expect(doc.components.securitySchemes.internalJwt).toMatchObject({ type: "apiKey", name: "Authorization" });
    expect(doc.components.schemas).toHaveProperty("PortfolioValue");
  });

  it("serves Swagger UI at /docs without a token", async () => {
    const res = await fetch(`${baseUrl}/docs/`);

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("swagger-ui");
  });
});
