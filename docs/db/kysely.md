# Работа с БД из кода (`@fms/db`)

`@fms/db` — реализация репозиториев из `@fms/core` (`src/application/ports/`) поверх [Kysely](https://kysely.dev/) + `pg`. Единственный пакет, где встречаются доменные типы `@fms/core` и реальный SQL.

## Структура пакета

```
packages/db/
  src/
    schema.ts                        # Kysely Database — типы таблиц как они есть в Postgres
    kysely.ts                        # фабрика подключения + фикс типов pg-драйвера
    errors.ts                        # pg-ошибки → доменные ошибки @fms/core
    index.ts                         # барель пакета
    repositories/
      kysely-account-repository.ts   # реализация AccountRepository (эталон)
    migrations/
      migrator.ts                    # настройка kysely Migrator
      run.ts                         # CLI: применить все миграции
      NNN_*.ts                       # сами миграции (пока нет ни одной)
```

## `schema.ts` — типы таблиц

Одна интерфейс-строка на таблицу (`UserRow`, `AccountRow`, `CategoryRow`, `SecurityRow`, `TransactionRow`, `TradeRow`), собранные в `Database`. Это **зеркало текущей реальной схемы Postgres**, не доменных типов `@fms/core` — совпадает с ними почти 1:1, но живёт отдельно, потому что смысл разный: `@fms/core`'s `AccountsTable` — контракт домена, `AccountRow` — то, что реально лежит в колонках.

Два нюанса типизации:

- **PK-колонки** — `Generated<number>` (`account_id: Generated<number>`). Это говорит Kysely: колонка выставляется базой сама (`SERIAL`), при `insertInto(...).values(...)` её можно не передавать, а `selectAll()` всё равно возвращает обычный `number`.
- **DECIMAL/NUMERIC-колонки** (`amount`, `price`, `quantity`, `face_value`, ...) — `ColumnType<number, number | string, number | string>` (алиас `Numeric`). Формально Postgres отдаёт `NUMERIC` как строку через `pg` (см. ниже) — тип честно описывает "может прийти как то, так и то", а по факту после фикса в `kysely.ts` там всегда `number`.

## `kysely.ts` — подключение

```ts
export function createKyselyInstance(config: PoolConfig): Kysely<Database>;
```

Берёт **готовый конфиг** (`host`/`port`/`user`/`password`/`database`), не читает `process.env` сам — чтение env вынесено на вызывающую сторону. `@fms/db` как пакет не должен решать, откуда берётся конфиг.

Важная деталь при импорте этого файла: сразу при загрузке модуля регистрируется

```ts
types.setTypeParser(1700, parseFloat);
```

Oid `1700` — это `NUMERIC` в Postgres. Драйвер `pg` по умолчанию отдаёт `NUMERIC` **строкой** (чтобы не терять точность на слишком больших числах), но весь домен `@fms/core` ожидает `number` (`amount: number`, `price: number`...). Без этой строчки каждый репозиторий получал бы `"150000.00"` вместо `150000` — молча, без ошибки типов, потому что происходит это в рантайме, а не на этапе `tsc`. Зарегистрирована один раз глобально на процесс, при первом импорте `@fms/db`.

## `errors.ts` — маппинг ошибок Postgres

```ts
export function mapPgError(err: unknown, entity: string): never;
```

Ловит `pg`'s `DatabaseError` по `.code`:

| Postgres code | Значение                | Доменная ошибка                                         |
| ------------- | ----------------------- | ------------------------------------------------------- |
| `23505`       | `unique_violation`      | `DuplicateEntryError` (`@fms/core`)                     |
| `23503`       | `foreign_key_violation` | `NotFoundError` (`@fms/core`)                           |
| остальное     | —                       | пробрасывается как есть (нетипизированная инфра-ошибка) |

Используется в `create`/`update` каждого репозитория: `.catch((err) => mapPgError(err, "Account"))`. Знание про коды `pg` — законная забота `@fms/db` (это адаптер), а не `@fms/core` (там инфраструктурные ошибки принципиально не типизируются).

## `repositories/` — все 5 реализованы

Все репозитории из `@fms/core` (`AccountRepository`, `CategoryRepository`, `SecurityRepository`, `TransactionRepository`, `TradeRepository`) реализованы, один паттерн на всех:

- `find*` — обычный `selectFrom(...).selectAll().where(...)`, `executeTakeFirst()` → `row ?? null`.
- `create` — `insertInto(...).values(...).returningAll().executeTakeFirstOrThrow()`, обёрнуто в `.catch((err) => mapPgError(err, "<Entity>"))`.
- `update` — `updateTable(...).set(...).where(pk, "=", id).executeTakeFirst()`, затем ручная проверка `result.numUpdatedRows === 0n` → `throw new NotFoundError(...)` (Kysely сам не кидает ошибку на "0 строк обновлено").
- `archive` (accounts/categories/securities) — то же самое, что `update`, но всегда `set({ is_archived: true })`.
- `delete` (transactions/trades — единственные с настоящим hard delete) — `deleteFrom(...).where(pk, "=", id).executeTakeFirst()`, `result.numDeletedRows === 0n` → `NotFoundError`.
- `find(filter)` (transactions/trades) — накопительный `let query = ...; if (filter.x !== undefined) query = query.where(...)`, поля фильтра комбинируются через AND.

### Nullable-поля: `undefined` (домен) ↔ `null` (колонка)

`SecuritiesTable`/`TransactionsTable` в `@fms/core` используют опциональные поля (`isin?: string`, `category_id?: number`, ...) — отсутствие значения выражается как `undefined`. В Postgres то же самое — `NULL`. Kysely не конвертирует одно в другое автоматически, поэтому `kysely-security-repository.ts` и `kysely-transaction-repository.ts` держат по паре приватных функций:

```ts
function toDomain(row: Selectable<SecurityRow>): SecuritiesTable {
  return { ..., isin: row.isin ?? undefined, ... };
}

function toRow(security: NewSecurity | SecuritiesTable) {
  return { ..., isin: security.isin ?? null, ... };
}
```

`toDomain` — после каждого `select` (`null` → `undefined`), `toRow` — перед каждым `insert`/`update` (`undefined` → `null`). `AccountRepository`, `CategoryRepository`, `TradeRepository` этого не делают — у них нет nullable-колонок, `Selectable<Row>` там уже структурно совпадает с доменным типом.

## Миграции

### Почему `db/init/` и `migrations/` — разные вещи

`db/init/*.sql` — bootstrap-скрипты для docker-compose, Postgres прогоняет их **один раз**, когда том `pg-data` пустой (см. [`db.md`](./db.md)). Это снимок схемы на момент создания проекта, не механизм эволюции — если том уже существует, эти файлы больше не выполнятся, сколько их ни редактируй (ровно это и случилось: `is_archived` добавили в SQL, а в уже поднятом контейнере колонки не было, пока не накатили `ALTER TABLE` руками).

**Начиная с этого момента, любое изменение схемы — новая миграция в `packages/db/src/migrations/`, а не правка `db/init`.** `db/init` считается замороженным снимком.

### Как устроен раннер

`migrations/migrator.ts`:

```ts
const migrationFolder = path.dirname(fileURLToPath(import.meta.url));

export function createMigrator(db: Kysely<Database>): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({ fs, path, migrationFolder }),
  });
}
```

`FileMigrationProvider` читает **все файлы из той же папки**, где лежит `migrator.ts` (т.е. `packages/db/src/migrations/`), сортирует по имени файла и применяет по порядку. Каждый файл экспортирует `up`/`down`.

`migrations/run.ts` — CLI-обвязка: грузит `.env` из корня репозитория (`process.loadEnvFile(...)`), создаёт подключение, вызывает `migrator.migrateToLatest()`, печатает результат по каждой миграции.

### Как написать новую миграцию

1. Создать файл в `packages/db/src/migrations/`, имя с сортируемым префиксом — иначе `FileMigrationProvider` применит их не в том порядке:

   ```
   001_initial_baseline.ts
   002_add_transactions_currency.ts
   003_...
   ```

   (Порядковый номер или timestamp — не важно, важно чтобы алфавитная сортировка = хронологический порядок.)

2. Экспортировать `up`/`down`, используя Kysely `schema`-билдер (не сырой SQL, если не обязательно — `sql` тег доступен из `kysely` для нестандартных случаев):

   ```ts
   import { Kysely, sql } from "kysely";

   export async function up(db: Kysely<any>): Promise<void> {
     await db.schema
       .alterTable("categories")
       .addColumn("description", "text")
       .execute();
   }

   export async function down(db: Kysely<any>): Promise<void> {
     await db.schema
       .alterTable("categories")
       .dropColumn("description")
       .execute();
   }
   ```

   Тип параметра — `Kysely<any>`, не `Kysely<Database>`: `Database` из `schema.ts` описывает **текущую** схему уже с учётом миграции, а миграция сама эту схему меняет, поэтому в её сигнатуре нет смысла завязываться на итоговый тип.

3. Если миграция добавляет колонку, которой ещё нет в домене/портах `@fms/core` — сначала синхронизировать `schema.ts` (тип строки), а если нужно и домен/порты в `@fms/core`.

4. Применить:

   ```bash
   pnpm --filter @fms/db migrate
   ```

   Требует поднятого Postgres (`pnpm docker:up`) и заполненного `.env` в корне (`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`/`POSTGRES_PORT`, опционально `POSTGRES_HOST`, по умолчанию `localhost`).

5. Проверить результат — `run.ts` печатает `Success: <имя_файла>` на каждую применённую миграцию. Kysely сам ведёт служебную таблицу `kysely_migration` в базе — какие миграции уже применены, повторно не накатывает.

### Откат

Явного CLI-скрипта под откат пока нет (`run.ts` вызывает только `migrateToLatest()`). Если понадобится — `migrator.migrateDown()` откатывает последнюю применённую миграцию, вызывая её `down()`; можно добавить как отдельный `migrations/rollback.ts` по аналогии с `run.ts`, когда возникнет реальная необходимость.
