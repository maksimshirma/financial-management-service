# Тестовая БД (`@fms/fixtures`)

`@fms/fixtures` — отдельный пакет, вся ответственность за жизненный цикл тестовой базы `finances_test`. Не зависит от `@fms/db` (специально, см. ниже) — переиспользуется любым пакетом, которому для тестов нужен реальный Postgres (`@fms/db` сейчас, `@fms/http`/`@fms/mcp` в будущем).

## Как пользоваться

```ts
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { resetTestDatabase, testDatabaseConfig, truncateAllTables } from "@fms/fixtures";

// один раз перед прогоном всех тестов (например, в Jest globalSetup / beforeAll)
await resetTestDatabase();

// подключение к чистой тестовой БД — через createKyselyInstance("@fms/db")
// либо напрямую, если типизированная схема не нужна
const db = createKyselyInstance(testDatabaseConfig());

// перед каждым тестом — чистый стол
beforeEach(() => truncateAllTables(db));

// после всех тестов
await db.destroy();
```

Три функции — весь публичный API:

| Функция | Когда вызывать | Что делает |
|---|---|---|
| `resetTestDatabase()` | один раз перед прогоном (`beforeAll`/`globalSetup`) | Пересоздаёт `finances_test` с нуля и накатывает схему |
| `testDatabaseConfig()` | при создании подключения | Возвращает `PoolConfig` (host/port/user/password/database) для `finances_test` — скормить в `pg.Pool` или `createKyselyInstance` из `@fms/db` |
| `truncateAllTables(db)` | перед каждым тестом (`beforeEach`) | `TRUNCATE` всех 6 таблиц, сброс серийных id (`RESTART IDENTITY CASCADE`) |

**Предусловие**: поднятый Postgres (`pnpm docker:up`) и заполненный `.env` в корне — та же связка, что у `migrate` в [`kysely.md`](./kysely.md).

**`resetTestDatabase()` не мокает БД, а гоняет настоящий Postgres** — тест это не unit, а полноценный integration test. Дорого по времени (пересоздание базы — секунды), поэтому вызывается один раз на весь прогон, а не перед каждым тестом; изоляция между тестами — через `truncateAllTables`, не через полный `resetTestDatabase`.

## Как это устроено

### Откуда берётся `finances_test`

`db/init/*.sql` в корне репо накатывается Postgres'ом только на `POSTGRES_DB` (`finances`) и только при первом старте контейнера на пустом томе — второй базы это не касается. `resetTestDatabase()` (`src/reset.ts`) решает это программно при каждом запуске:

1. Подключается **не к `finances_test`, а к обычной dev-базе** `finances` (через `adminDatabaseConfig()` — тот же хост/юзер/пароль, но `database: POSTGRES_DB`). К базе, которую собираешься дропнуть, подключаться нельзя — Postgres не даст.
2. `DROP DATABASE IF EXISTS finances_test WITH (FORCE)` — сносит старую, если была (`WITH (FORCE)`, Postgres 13+, разрывает чужие активные коннекты, если где-то завис старый pool). `CREATE DATABASE finances_test` — заводит чистую.
3. Переподключается уже к свежей `finances_test` и прогоняет `db/init/01_enums.sql` … `07_trades.sql` по порядку — **без `08_seed.sql`**, тестовые данные тесты создают сами себе.

Каждый прогон — гарантированно чистая база без дрейфа схемы и без огрызков прошлых тестов.

### Почему сырой `pg`, а не Kysely

`DROP DATABASE`/`CREATE DATABASE` и "выполнить файл с несколькими SQL-командами одним вызовом" — оба требуют simple query protocol (`client.query(sqlString)` без параметров). Kysely всегда шлёт запросы через parameterized/extended-протокол `pg`, а он мульти-стейтмент строки не пропускает. Поэтому `reset.ts` работает напрямую через `pg.Client`, а не через `Kysely`.

### Почему `@fms/fixtures` не зависит от `@fms/db`

Соблазн был — `truncateAllTables` мог бы типизироваться как `Kysely<Database>` (схема из `@fms/db`). Но `@fms/db` тестам понадобится сам `@fms/fixtures` как `devDependency` — вышел бы цикл `db → fixtures → db` в графе воркспейса. `pnpm install` цикл переживает (с warning), а вот `pnpm -r build`/`pnpm -r check:types` — нет: топологический порядок сборки неоднозначен, команда падает с `ERR_PNPM_TASK_CYCLE` для **всей монорепы**, не только этих двух пакетов.

Решение — `truncateAllTables(db: Kysely<any>)`. Раз `sql`-тег (`sql\`TRUNCATE ...\`.execute(db)`) не завязан на конкретную схему, типизированный `Database` тут просто не нужен. `@fms/fixtures` ни от кого в воркспейсе не зависит, `@fms/db` зависит от него только как `devDependency` — граф остаётся ациклическим.

## Структура пакета

```
packages/fixtures/
  src/
    config.ts     # testDatabaseName(), testDatabaseConfig(), adminDatabaseConfig() (внутренний)
    reset.ts       # resetTestDatabase()
    truncate.ts    # truncateAllTables(db)
    index.ts       # барель: testDatabaseName, testDatabaseConfig, resetTestDatabase, truncateAllTables
```

`config.ts` сам грузит `.env` из корня репозитория (`process.loadEnvFile`) и выводит имя тестовой БД как `` `${POSTGRES_DB}_test` `` — новой переменной окружения заводить не пришлось.
