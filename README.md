# Сервис по работе с финансами

Личный финансовый трекер: счета, категории доходов/расходов, переводы между счетами, учёт ценных бумаг (акции/облигации/фонды) и сделок с ними (покупка/продажа). Бизнес-логика доступна через два адаптера — HTTP API (в разработке) и MCP-сервер для AI-агентов (Claude Desktop/Code).

## Архитектура

Монорепозиторий, pnpm workspaces, 6 пакетов в `packages/`:

- **`@fms/core`** — доменная модель и use-case'ы (счета, категории, бумаги, транзакции, сделки). Чистый TypeScript, без зависимости от БД.
- **`@fms/db`** — реализация репозиториев `@fms/core` на Kysely + Postgres, миграции.
- **`@fms/moex`** — данные Мосбиржи (MOEX ISS): поиск бумаг, справочные данные, котировки, график купонов. Реализует порт `MarketDataProvider` из `@fms/core`.
- **`@fms/config`** — чтение `.env` в одном месте для всех адаптеров.
- **`@fms/fixtures`** — жизненный цикл тестовой БД (`finances_test`) для интеграционных тестов.
- **`@fms/mcp`** — MCP-сервер: 32 tool'а, по одному на каждый use-case `@fms/core`.

Правило графа зависимостей: `core` ← ничего, `db` ← `core`, `moex` ← `core`, `mcp`/`http` ← `core` + `db` + `moex`. Подробности — в [`CLAUDE.md`](CLAUDE.md).

## Документация

- [`docs/db/db.md`](docs/db/db.md) — схема БД, ER-диаграмма, ключевые решения
- [`docs/db/schema.md`](docs/db/schema.md) — таблицы и constraints подробно
- [`docs/db/kysely.md`](docs/db/kysely.md) — работа с БД из кода, миграции
- [`docs/db/fixtures.md`](docs/db/fixtures.md) — тестовая БД для интеграционных тестов
- [`docs/db/pgadmin.md`](docs/db/pgadmin.md) — веб-интерфейс для Postgres
- [`docs/mcp.md`](docs/mcp.md) — запуск MCP-сервера (Docker/stdio/HTTP), подключение к Claude Desktop/Code
- [`docs/test/test.md`](docs/test/test.md) — тестовая инфраструктура (Jest, один конфиг на монорепо)
- [`docs/test/integrations.md`](docs/test/integrations.md) — подход к интеграционным тестам

## Стек

- TypeScript (ESM), pnpm workspaces
- Postgres 16 — Kysely как типобезопасная обёртка над SQL
- MCP (`@modelcontextprotocol/sdk`) — AI-агент как клиент сервиса
- Jest — тесты (интеграционные, реальный Postgres)
- Docker / docker-compose — Postgres, pgAdmin, MCP-сервер

## Установка

```bash
git clone <repo_url>
cd financial-management-service
pnpm install
cp .env.example .env   # заполнить POSTGRES_*, PGADMIN_*
```

## Сценарии запуска

### 1. Поднять инфраструктуру (Postgres + pgAdmin)

```bash
pnpm docker:up
```

Схема накатывается автоматически из `db/init/*.sql` при первом старте (пустой volume). pgAdmin — на `http://localhost:${PGADMIN_PORT}` (детали подключения — [`docs/db/pgadmin.md`](docs/db/pgadmin.md)).

Пересоздать схему с нуля:

```bash
pnpm docker:down -v
pnpm docker:up
```

### 2. Собрать пакеты и применить миграции

```bash
pnpm build                       # tsc -b, все пакеты по графу зависимостей
pnpm --filter @fms/db migrate    # накатить миграции из packages/db/src/migrations
```

### 3. Тесты

```bash
pnpm test                              # все пакеты
pnpm test --selectProjects "@fms/db"   # только один проект
```

Требует поднятого Postgres (шаг 1) — тесты `@fms/db` бьют в настоящую БД (`finances_test`), без моков. Подробности — [`docs/test/test.md`](docs/test/test.md).

### 4. MCP-сервер — продакшн-способ (Docker)

```bash
docker build -f Dockerfile.mcp -t fms-mcp:local .
docker compose --profile mcp run --rm -i mcp
```

Подключение к Claude Desktop/Code, HTTP-режим для удалённого доступа, троблшутинг — всё в [`docs/mcp.md`](docs/mcp.md). Для Claude Code `.mcp.json` уже в корне репозитория — ничего дополнительно настраивать не нужно.

### 5. MCP-сервер — локальная разработка (без Docker)

```bash
pnpm dev:build                      # терминал 1 — tsc -b --watch, держит dist всех пакетов свежим
pnpm --filter @fms/mcp dev          # терминал 2 — tsx watch src/main.ts
```

### 6. Проверка типов

```bash
pnpm check:types
```
