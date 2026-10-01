# financial-management-service

Stack: TypeScript (ESM), pnpm workspaces, Kysely/Postgres.

## Packages

4 pnpm workspace packages under `packages/`:

- **`@fms/core`** — pure business logic. Zero workspace deps.
  - `src/domain/` — types + invariants (`account/`, `transaction/`, `category/`, `security/`, `trade/`, `shared/` for Money/Currency/domain errors). No imports outside `domain/`.
  - `src/application/` — use-cases, one file per use-case (`<feature>/<verb-noun>.ts`, e.g. `accounts/create-account.ts`). This is the single API both adapters call — never duplicate a use-case per adapter.
  - `src/application/ports/` — interfaces the application depends on (repositories, clock). No `kysely` import anywhere in `core`.
  - `src/index.ts` — barrel, the only surface other packages should import from.

- **`@fms/db`** — Kysely implementation of `@fms/core`'s ports. Deps: `@fms/core` (workspace:\*), `kysely`.
  - `src/kysely.ts`, `src/schema.ts`, `src/repositories/` (implements `application/ports` interfaces).
  - `migrations/` — Kysely TS migration files (schema evolution as code). Root-level `db/init/` (raw bootstrap SQL for docker-compose) is separate infra config, not app code — leave it there.

- **`@fms/http`** — HTTP API adapter. Deps: `@fms/core`, `@fms/db`.
  - `src/server.ts`, `src/routes/`, `src/dto/` (request/response mapping), `src/main.ts` (composition root: wires `@fms/db` repos into `@fms/core` use-cases, starts server).

- **`@fms/mcp`** — MCP server adapter for the AI agent. Deps: `@fms/core`, `@fms/db`.
  - `src/server.ts`, `src/tools/`, `src/resources/`, `src/main.ts` (composition root, same pattern as http).

## Dependency graph (enforced via package.json, not just convention)

```
core  ← nothing
db    ← core
http  ← core, db
mcp   ← core, db
```

- `db` never depends on `http`/`mcp`. `http` and `mcp` never depend on each other or call each other directly.
- Inside `core`: `domain` → nothing; `application` → `domain` + its own `ports` only.
- HTTP and MCP share logic by importing the same `@fms/core` use-case — never by one adapter calling the other.
- Only each adapter's `main.ts` imports both `@fms/core` (interfaces/use-cases) and `@fms/db` (concrete impls) to wire them together.

## Where new code goes

| Need                                | Location                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| New business rule/invariant         | `core/src/domain`                                                                                 |
| Orchestration used by both adapters | `core/src/application/<feature>/<verb-noun>.ts`                                                   |
| New persistence need                | add method to interface in `core/src/application/ports`, implement in `db/src/repositories`       |
| New HTTP endpoint                   | thin handler in `http/src/routes`: parse input, call one use-case, map result — no business logic |
| New MCP tool                        | thin handler in `mcp/src/tools`: same pattern                                                     |

## Naming

- kebab-case files/folders, no dates in names.
- Use-case files are verb-first: `record-transaction.ts`, not `transaction-service.ts`.
- One primary export per use-case/repository file.
- Package names: `@fms/core`, `@fms/db`, `@fms/http`, `@fms/mcp`.

## Testing

- Tests live in `__jest__/` dirs next to the code they cover (e.g. `core/src/application/accounts/__jest__/create-account.test.ts`), not co-located as siblings.
- Integration tests (real Postgres via `docker-compose.yml`) live in `packages/db/__jest__/integration/`.
- Runner: Jest, per package (`jest.config.ts` in each package, or shared root config with `projects`).

## Build / dev

- `pnpm -r build` — pnpm runs recursive scripts in workspace-dependency-topological order automatically (`core` builds before `db`, `db` before `http`/`mcp`).
- Each package's `tsconfig.json` extends root `tsconfig.base.json`; use TS project references (`composite: true`, `references`) for cross-package `tsc -b` and editor go-to-definition.
- Dev: each package's `main`/`exports` point at `dist`, so cross-package edits need `dist` kept fresh — run `pnpm dev:build` (`tsc -b --watch`, rebuilds every package incrementally via project references) in one terminal, and `pnpm --filter @fms/mcp dev` (`tsx watch src/main.ts`) in another for whichever adapter you're running.
- `process.env` reads centralized in a `config` module per adapter (or a shared `@fms/config` package if env needs sharing across `http`/`mcp`/`db`).
