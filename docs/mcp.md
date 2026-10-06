# `@fms/mcp` — запуск и подключение

MCP-сервер на `@modelcontextprotocol/sdk` (v1). Поддерживает два транспорта: **stdio** (по умолчанию, для локальных клиентов типа Claude Desktop/Code — см. ниже) и **Streamable HTTP** (`MCP_TRANSPORT=http`, для удалённого доступа по URL — см. раздел «HTTP-режим»). 32 tool'а — по одному на каждый use-case из `@fms/core` (accounts/categories/securities/transactions/trades/quotes/portfolio). Tool'ы с `openWorldHint` ходят в MOEX ISS (`@fms/moex`). Устройство пакета — см. код: `packages/mcp/src/server.ts` (композиция, транспорт-агностична), `main.ts` (композиционный корень, выбирает транспорт по `MCP_TRANSPORT`), `http-transport.ts` (Express-обвязка HTTP-режима), `tools/**` (сами tool'ы).

Сервер деплоится и запускается через **Docker** — это основной способ. Голый `tsx`/`node` без контейнера остаётся только для локальной разработки самого `@fms/mcp` (правка кода тулов и быстрая проверка без пересборки образа).

## Предусловия

```bash
pnpm docker:up          # поднять Postgres (+ pgadmin)
cp .env.example .env    # если ещё не сделано, заполнить POSTGRES_*
```

## Образ

`Dockerfile.mcp` (в корне репозитория) — мультистейдж:

1. `build` — полный `pnpm install --frozen-lockfile` по всему workspace, затем `pnpm -r --filter-prod "@fms/mcp..." run build` (компилирует только `@fms/mcp` и его прод-граф зависимостей — `config`/`core`/`db`/`moex`, минуя `fixtures`, который `@fms/mcp` не использует), затем `pnpm --filter @fms/mcp deploy --prod /deploy/mcp` — собирает самодостаточную директорию: только `dist` каждого пакета (никакого `src`, `__jest__`, `*.tsbuildinfo` — это гарантирует `"files": ["dist"]` в `package.json` каждого пакета) + прод-зависимости.
2. `runtime` — чистый `node:22-alpine`, без `pnpm`/`corepack`, просто копирует результат `deploy` и запускает `node dist/main.js`.

Собрать образ:

```bash
docker build -f Dockerfile.mcp -t fms-mcp:local .
```

Пересобирать нужно после **любой** правки кода в `packages/{mcp,db,moex,core,config}/src` — образ не видит живые изменения, в отличие от локального `tsx watch`.

## Запуск через docker compose

В `docker-compose.yml` сервис `mcp` сидит за `profiles: ["mcp"]` — он **не** стартует при обычном `pnpm docker:up` (`docker-compose up -d`). Это намеренно: сервер работает по stdio, то есть должен быть привязан к stdin конкретного клиента-процесса, а не висеть фоновым демоном без читателя на том конце. Запускать всегда через `run`, никогда через `up`:

```bash
docker compose --profile mcp run --rm -i mcp
```

- `--rm` — убрать контейнер после выхода (stdio-сервер умирает, когда клиент закрывает stdin — это нормальное завершение, не сбой).
- `-i` — обязателен, иначе stdin контейнера не подключён ни к чему и сервер зависнет, ожидая ввод, которого никогда не будет.
- `depends_on: postgres (condition: service_healthy)` — compose сам подождёт готовности Postgres перед стартом `mcp`.
- Внутри сети compose сервис видит Postgres по имени `postgres:5432` (не по `${POSTGRES_PORT}` — это host-мапленный порт из `postgres`-сервиса, внутри сети он не актуален). Эти env'ы уже прописаны в `docker-compose.yml`, руками передавать не нужно.

## Проверка руками, без клиента

Подать JSON-RPC прямо в stdin контейнера:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | docker compose --profile mcp run --rm -i mcp
```

Полноценный handshake + список tool'ов:

```bash
(
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"0.0.1"}}}'
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
) | docker compose --profile mcp run --rm -i mcp
```

Ответ приходит в stdout как JSON-RPC, диагностика (`fms MCP server running on stdio` и т.п.) — в stderr, подмешанный docker-compose-логами старта контейнера. Это нормально.

Ошибка домена (`NotFoundError`/`DuplicateEntryError`/`InvalidTransactionError`) приходит не крашем процесса, а `{"isError":true,"content":[{"type":"text","text":"<message>"}]}` — сервер жив, можно слать следующий запрос.

## Подключение к Claude Desktop

Конфиг (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "fms": {
      "command": "docker",
      "args": [
        "compose",
        "--project-directory",
        "/Users/maksim/Projects/Code/active/financial-management-service",
        "--profile",
        "mcp",
        "run",
        "--rm",
        "-i",
        "mcp"
      ]
    }
  }
}
```

`--project-directory` — намеренно абсолютный: Claude Desktop запускает команду не гарантированно с тем же `cwd`, что твой шелл, а `docker compose` без него будет искать `docker-compose.yml` в случайном месте.

После правки конфига — полностью перезапустить Claude Desktop (не просто новый чат). Если сервер подключился, tool'ы (`create-account`, `record-income-expense`, ...) появятся в списке доступных инструментов у модели.

## Подключение к Claude Code

Файл `.mcp.json` в корне репозитория (Claude Code подхватывает его автоматически для проекта, `--project-directory` не нужен — cwd уже корень репо):

```json
{
  "mcpServers": {
    "fms": {
      "command": "docker",
      "args": ["compose", "--profile", "mcp", "run", "--rm", "-i", "mcp"]
    }
  }
}
```

Это и есть текущее содержимое `.mcp.json` — ничего дополнительно настраивать не нужно.

Альтернатива через CLI (без `.mcp.json`):

```bash
claude mcp add fms -- docker compose --profile mcp run --rm -i mcp
```

Проверить, что сервер поднялся: `/mcp` внутри сессии Claude Code — покажет статус подключения и список tool'ов.

После смены конфига (`.mcp.json` или образа) переподключение подхватывается на следующий рестарт клиента/сессии — текущая открытая сессия продолжает работать со старым процессом до перезапуска.

## HTTP-режим (удалённый доступ по URL)

Stdio-транспорт требует, чтобы клиент сам спавнил процесс и подключал к нему свои stdin/stdout — работает только там, где можно запустить произвольную команду (Claude Desktop/Code с установленным Docker). **Streamable HTTP**-транспорт убирает это требование: сервер крутится постоянно где-то одном месте, а любой MCP-совместимый агент (включая хостед/веб-агентов, которые не могут спавнить локальный процесс) просто добавляет его по URL.

Сервер в HTTP-режиме **stateless** — на каждый HTTP-запрос создаётся свежий `McpServer` + свежий `StreamableHTTPServerTransport` (SDK сам бросает исключение при попытке переиспользовать stateless transport между запросами), без session-машинерии. Это нормально: сервер никогда не шлёт server-initiated нотификации, только отвечает на запросы.

Включается через env:

| Переменная      | Значение                 | Смысл                                                                                                                                           |
| --------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `MCP_TRANSPORT` | `http`                   | без неё (или `stdio`) — поведение не меняется, это дефолт                                                                                       |
| `MCP_API_KEY`   | длинная случайная строка | **обязательна** в HTTP-режиме — сервер откажется стартовать без неё (fail fast, никогда не поднимется неавторизованным публичным листенером)    |
| `PORT`          | например `3000`          | порт, который слушает Express; дефолт `3000`. Это имя — конвенция большинства PaaS-хостов (Fly.io/Railway/Render), которые сами его прокидывают |

Авторизация — один общий секрет, `Authorization: Bearer <MCP_API_KEY>`, сравнение простым строковым равенством (`packages/mcp/src/http-transport.ts`). Это осознанный компромисс для single-tenant личного сервера, а не полноценный multi-tenant access control — если сервер когда-нибудь будет обслуживать больше одного доверенного клиента, стоит пересмотреть (constant-time compare, разные ключи на клиента).

### Локальный smoke-тест

Сервис `mcp-http` в `docker-compose.yml` — в отличие от `mcp`, это обычный демон (`restart: unless-stopped`), сидит за своим профилем `profiles: ["mcp-http"]`, чтобы не включаться при голом `pnpm docker:up`:

```bash
# в .env: MCP_API_KEY=<сгенерированный секрет>, например:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
docker compose --profile mcp-http up -d mcp-http
docker compose logs -f mcp-http   # ждём "listening on :3000"
```

```bash
# без токена — 401
curl -i http://localhost:3000/mcp \
  -X POST -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

```bash
# с токеном — 200 + список tool'ов. Заголовок accept обязателен — без него
# StreamableHTTPServerTransport отвечает 406 (SDK требует, чтобы клиент
# принимал оба формата: JSON-ответ и SSE-стрим).
curl -i http://localhost:3000/mcp \
  -X POST \
  -H "authorization: Bearer $MCP_API_KEY" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

```bash
# health-check без авторизации — 200
curl -i http://localhost:3000/healthz
```

Остановить, не трогая `postgres`/`pgadmin`/`mcp`:

```bash
docker compose --profile mcp-http down mcp-http
```

### Где хостить (на будущее)

Сам образ (`fms-mcp:local`, тот же `Dockerfile.mcp`) не меняется между режимами — выбор транспорта целиком на env-переменных, так что один и тот же образ едет куда угодно:

- **VPS + reverse-proxy** (nginx/Caddy) — TLS-терминация перед plain-HTTP портом контейнера, полный контроль, больше ручной настройки.
- **PaaS** (Fly.io, Railway, Render и т.п.) — HTTPS из коробки, обычно сами прокидывают `PORT` (поэтому эта конвенция и выбрана здесь).

Сервер полностью stateless, так что при нескольких инстансах за балансировщиком не нужны sticky sessions или общее хранилище сессий.

### Подключение удалённого агента

> Иллюстративно, не истина в последней инстанции — конкретный формат `url`/заголовков авторизации в конфиге зависит от клиента и может меняться. Проверяй актуальную документацию того агента, который подключаешь, на момент подключения.

```jsonc
{
  "mcpServers": {
    "fms": {
      "url": "https://<your-host>/mcp",
      "headers": { "Authorization": "Bearer <MCP_API_KEY>" },
    },
  },
}
```

## Локальная разработка без Docker

Пересобирать образ на каждую правку кода — медленно. Для итерации по самому `@fms/mcp` (или зависимым `core`/`db`/`config`) работай напрямую с `tsx`, без контейнера:

```bash
pnpm dev:build                      # терминал 1 — tsc -b --watch, держит dist всех пакетов свежим
pnpm --filter @fms/mcp dev          # терминал 2 — tsx watch src/main.ts
```

`main`/`exports` всех пакетов указывают на `dist`, поэтому `dev:build` обязателен — без него правки в `@fms/core`/`@fms/db` не долетят до `@fms/mcp`, пока не пересобрать вручную.

Ручная проверка тем же способом, что и раньше (stdin/stdout), но без Docker:

```bash
cd packages/mcp
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | pnpm exec tsx src/main.ts
```

В этом режиме сервер сам грузит `.env` из корня репозитория (через `@fms/config`) — переменные руками экспортировать не нужно. Внутри Docker `.env` недоступен (и не должен быть) — там переменные приходят через `environment:` в `docker-compose.yml`.

Важно: **stdout — это протокол**, туда нельзя ничего печатать кроме JSON-RPC (`console.log` где угодно в коде сервера сломает подключение любого клиента, хоть в Docker, хоть без него). Все диагностические сообщения идут в stderr (`console.error`) — уже так и сделано в `main.ts`.

## Список tool'ов

| Группа       | Tool'ы |
| ------------ | ------ |
| accounts     | `create-account`, `update-account`, `archive-account`, `list-accounts`, `list-archived-accounts`, `get-account` |
| categories   | `create-category`, `update-category`, `archive-category`, `list-categories`, `list-archived-categories` |
| securities   | `search-securities`, `import-security`, `create-security`, `update-security`, `archive-security`, `list-securities`, `list-archived-securities`, `find-security-by-ticker`, `get-bond-schedule` |
| transactions | `record-income-expense`, `transfer-between-accounts`, `update-transaction`, `delete-transaction`, `list-transactions` |
| trades       | `buy-security`, `sell-security`, `update-trade`, `delete-trade`, `list-trades` |
| quotes       | `get-security-quote` |
| portfolio    | `get-portfolio-value` |

Бумаги Мосбиржи заводятся через `search-securities` → `import-security` (реквизиты берутся из ISS, бумага попадает в общий справочник и в список домохозяйства). `create-security` — только для бумаг вне Мосбиржи, такая бумага видна лишь своему домохозяйству. Котировки ISS отдаёт с задержкой 15 минут; при недоступности ISS `get-portfolio-value` не падает, а возвращает позиции в `unpriced` и `quotesError`.

Имя tool'а = имя файла use-case'а в `packages/core/src/application/`, 1:1 — описание и точную схему аргументов смотри там же или через `tools/list`.

## Троблшутинг

- **Клиент не видит tool'ы / подключение молча не работает** — почти всегда что-то попало в stdout помимо JSON-RPC. Проверить вручную способом выше: если между JSON-строками в выводе есть посторонний текст — искать `console.log` (должен быть только `console.error`).
- **Контейнер висит, ничего не отвечает** — забыт флаг `-i` у `docker compose run`, или вместо `run` по ошибке использован `up -d` (сервис за `profiles: ["mcp"]` специально не стартует с `up`, но `up --profile mcp` его бы поднял демоном без stdin — не делай так).
- **Изменения в коде не видны в контейнере** — образ не пересобран. `docker build -f Dockerfile.mcp -t fms-mcp:local .` после каждой правки в `packages/{mcp,db,moex,core,config}/src`.
- **`[@fms/config] "POSTGRES_HOST" is not set` в stderr** — ожидаемо при локальном запуске без Docker (`.env` его не содержит, код падает на дефолт `localhost`). В `docker-compose.yml` для сервиса `mcp` эта переменная выставлена явно (`POSTGRES_HOST: postgres`) — в контейнере warning не должен появляться.
- **Ошибка подключения к Postgres из контейнера** — `docker compose ps` (и `postgres`, и `mcp`-ран должны видеть сеть), проверить что `postgres` в статусе `healthy` (`depends_on: condition: service_healthy` у `mcp` должен это гарантировать сам, но если `pnpm docker:up` не выполнялся заранее — `docker compose --profile mcp run` поднимет и `postgres` тоже, просто с нуля, что медленнее).
- **`pnpm install --frozen-lockfile` падает внутри `docker build`** — лок-файл не синхронен с `package.json` (забыли закоммитить/перегенерировать после правки зависимостей). Прогнать `pnpm install` локально, закоммитить `pnpm-lock.yaml`, пересобрать образ.
- **Tool падает с `isError: true` и непонятным текстом** — это реальная ошибка домена (`@fms/core`), не транспорта. Текст — `.message` брошенного исключения (`NotFoundError`/`DuplicateEntryError`/`InvalidTransactionError`), там уже написано что не так (`"Account not found: 5"` и т.п.).
- **401 на каждый запрос в HTTP-режиме** — проверить, что заголовок `Authorization: Bearer <...>` отправляется и токен совпадает с `MCP_API_KEY` контейнера (`docker compose exec mcp-http env | grep MCP_API_KEY` для сверки).
- **`mcp-http` падает сразу после старта** — `MCP_API_KEY` не задан в `.env`/окружении (сервер намеренно отказывается стартовать без него в HTTP-режиме, см. лог контейнера).
- **406 Not Acceptable в HTTP-режиме** — забыт заголовок `accept: application/json, text/event-stream` на запросе к `/mcp` — `StreamableHTTPServerTransport` требует явно принимать оба формата.
- **`GET /mcp` → 405** — ожидаемо: эндпоинт принимает только `POST`. Этот сервер не шлёт server-initiated push/SSE-нотификации, которым был бы нужен `GET`.
