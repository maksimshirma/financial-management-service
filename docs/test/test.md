# Тестирование

Раннер — Jest, один конфиг на весь монорепозиторий: [`jest.config.cjs`](../../jest.config.cjs) в корне. Не по конфигу на пакет — Jest относится ко всему репо, каждый пакет с тестами получает свою запись в `projects`, а не отдельный файл конфига.

```bash
pnpm test                              # все тесты, все проекты
pnpm test --selectProjects "@fms/db"   # только один проект
```

## Что покрыто сейчас

| Пакет | Вид тестов | Где |
|---|---|---|
| `@fms/db` | Integration, реальный Postgres | `packages/db/__jest__/integration/` — подробности в [`integrations.md`](./integrations.md) |
| `@fms/core` | — | ещё не написаны (юзкейсы application/* с фейковыми in-memory портами) |

## Устройство корневого конфига

```js
module.exports = {
  maxWorkers: 1,
  projects: [
    {
      displayName: "@fms/db",
      rootDir: "<rootDir>/packages/db",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__jest__/**/*.test.ts"],
      transform: { "^.+\\.(t|j)s$": swcTransform },
      transformIgnorePatterns: [...],
      globalSetup: "<rootDir>/__jest__/integration/global-setup.ts",
    },
  ],
};
```

- **`projects`** — массив, один элемент на пакет. Новый пакет с тестами (`@fms/core`, потом `@fms/http`/`@fms/mcp`) добавляет сюда ещё один объект, не создаёт свой `jest.config.cjs`.
- **`maxWorkers: 1`** — глобально, влияет на все проекты. Нужен, потому что `@fms/db`'s интеграционные тесты шарят одну БД между файлами и чистят её в `beforeEach` — при параллельных воркерах это гонка (один файл может truncate-нуть данные, с которыми ещё работает другой). Если появится проект, где тестам параллелизм не мешает (например, чистый unit `@fms/core` без внешнего состояния), это ограничение всё равно действует на весь прогон — цена за простоту одного общего конфига.
- **Транспиляция — `@swc/jest`**, не `ts-jest`. Быстрее, ESM без танцев с флагами, не типизирует на лету (см. ниже почему это не баг).

## Зачем `.cjs`, а не `.ts`/`.js`

Корневой `package.json` — `"type": "module"`. Обычный `jest.config.js` в такой пакете Node попытался бы разобрать как ESM, а Jest ожидает грузить конфиг синхронно через `require`. `.cjs` — однозначно CommonJS независимо от `"type"` в `package.json`, без обвязки через `ts-node` просто ради загрузки конфига.

## Тестовые файлы не типизируются через `tsc`

`packages/db/tsconfig.json`'s `include` — только `src`, `__jest__/` туда сознательно не входит. Тесты не часть сборки: `@swc/jest` транспилирует и гоняет их напрямую, без прохода через `tsc`/project references. Ошибку типа в тесте поймает сам прогон теста (или редактор), не `pnpm -r check:types`.

## Живая база, не моки

Все тесты `@fms/db` бьют в реальный Postgres (через `@fms/fixtures`, отдельную тестовую БД `finances_test`) — не мокают Kysely/`pg`. Так и задумано: репозитории — тонкий слой над SQL, замокать сам SQL значило бы не тестировать ничего реального (rewrite-of-the-logic-under-test). Подробности — [`integrations.md`](./integrations.md).

Предусловие для любого прогона: поднятый Postgres (`pnpm docker:up`) и заполненный `.env` в корне.
