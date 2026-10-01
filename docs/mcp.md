# `@fms/mcp` — запуск и подключение

MCP-сервер на `@modelcontextprotocol/sdk` (v1), stdio-транспорт. 27 tool'ов — по одному на каждый use-case из `@fms/core` (accounts/categories/securities/transactions/trades). Устройство пакета — см. код: `packages/mcp/src/server.ts` (композиция), `main.ts` (композиционный корень), `tools/**` (сами tool'ы).

## Предусловия

```bash
pnpm docker:up          # поднять Postgres
cp .env.example .env    # если ещё не сделано, заполнить POSTGRES_*
```

Сервер сам грузит `.env` из корня репозитория (через `@fms/config`) — ничего вручную экспортировать в шелл не нужно.

## Запуск вручную

```bash
pnpm --filter @fms/mcp start
```

Процесс виснет и ждёт JSON-RPC-сообщения на **stdin**, ответы пишет в **stdout**, логи — в **stderr**. Это нормально — стандартный stdio MCP-сервер не завершается сам, его останавливает клиент (Ctrl+C руками при отладке).

Важно: **stdout — это протокол**, туда нельзя ничего печатать кроме JSON-RPC (`console.log` где угодно в коде сервера сломает подключение любого клиента). Все диагностические сообщения идут в stderr (`console.error`) — уже так и сделано в `main.ts`.

## Проверка руками, без клиента

Можно подать JSON-RPC прямо в stdin и посмотреть ответ:

```bash
cd packages/mcp
(
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"0.0.1"}}}'
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
) | pnpm exec tsx src/main.ts
```

Ответ — `initialize` (protocolVersion, serverInfo), затем `tools/list` со всеми 27 схемами (JSON Schema, сгенерированные из Zod). Вызвать конкретный tool:

```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list-accounts","arguments":{"userId":1}}}'
```

Ошибка домена (`NotFoundError`/`DuplicateEntryError`/`InvalidTransactionError`) приходит не крашем процесса, а `{"isError":true,"content":[{"type":"text","text":"<message>"}]}` — сервер жив, можно слать следующий запрос.

## Подключение к Claude Desktop

Конфиг (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "fms": {
      "command": "/Users/maksim/Projects/Code/active/financial-management-service/packages/mcp/node_modules/.bin/tsx",
      "args": [
        "/Users/maksim/Projects/Code/active/financial-management-service/packages/mcp/src/main.ts"
      ]
    }
  }
}
```

Абсолютные пути — намеренно: Claude Desktop запускает команду не гарантированно с тем же `PATH`/`cwd`, что твой шелл, так что `pnpm`/`npx` резолвиться может не так, как ожидаешь. Прямой путь до `tsx`-бинарника в `node_modules/.bin/` внутри монорепы обходит это полностью.

После правки конфига — полностью перезапустить Claude Desktop (не просто новый чат). Если сервер подключился, tool'ы (`create-account`, `record-income-expense`, ...) появятся в списке доступных инструментов у модели.

## Подключение к Claude Code

Вариант 1 — CLI:

```bash
claude mcp add fms -- /Users/maksim/Projects/Code/active/financial-management-service/packages/mcp/node_modules/.bin/tsx /Users/maksim/Projects/Code/active/financial-management-service/packages/mcp/src/main.ts
```

Вариант 2 — файл `.mcp.json` в корне репозитория (Claude Code подхватывает его автоматически для проекта, пути можно относительные — cwd уже корень репо):

```json
{
  "mcpServers": {
    "fms": {
      "command": "tsx",
      "args": ["packages/mcp/src/main.ts"]
    }
  }
}
```

Проверить, что сервер поднялся: `/mcp` внутри сессии Claude Code — покажет статус подключения и список tool'ов.

## Список tool'ов

| Группа | Tool'ы |
|---|---|
| accounts | `create-account`, `update-account`, `archive-account`, `list-accounts`, `list-archived-accounts`, `get-account` |
| categories | `create-category`, `update-category`, `archive-category`, `list-categories`, `list-archived-categories` |
| securities | `create-security`, `update-security`, `archive-security`, `list-securities`, `list-archived-securities`, `find-security-by-ticker` |
| transactions | `record-income-expense`, `transfer-between-accounts`, `update-transaction`, `delete-transaction`, `list-transactions` |
| trades | `buy-security`, `sell-security`, `update-trade`, `delete-trade`, `list-trades` |

Имя tool'а = имя файла use-case'а в `packages/core/src/application/`, 1:1 — описание и точную схему аргументов смотри там же или через `tools/list`.

## Троблшутинг

- **Клиент не видит tool'ы / подключение молча не работает** — почти всегда что-то попало в stdout помимо JSON-RPC. Проверить вручную способом выше: если между JSON-строками в выводе есть посторонний текст — искать `console.log` (должен быть только `console.error`).
- **`[@fms/config] "POSTGRES_HOST" is not set` в stderr** — ожидаемо, не баг. `POSTGRES_HOST` опционален, код падает на `?? "localhost"`. В `.env` его нет и не должно быть.
- **Ошибка подключения к Postgres** — `pnpm docker:up`, затем `docker compose ps` (оба контейнера `healthy`/`Up`), затем проверить `.env` — `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`/`POSTGRES_PORT` должны совпадать с тем, что в `docker-compose.yml`.
- **Tool падает с `isError: true` и непонятным текстом** — это реальная ошибка домена (`@fms/core`), не транспорта. Текст — `.message` брошенного исключения (`NotFoundError`/`DuplicateEntryError`/`InvalidTransactionError`), там уже написано что не так (`"Account not found: 5"` и т.п.).
