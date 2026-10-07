# `@fms/http` — REST API

HTTP-адаптер для будущего фронта. Бизнес-логики не содержит: каждый маршрут парсит вход (zod), вызывает один use-case `@fms/core` и отдаёт результат. Собственной модели пользователей нет — сервер проверяет internal-JWT, выпущенный identity-service (RFC «Внедрение в текущий identity»).

Код: `packages/http/src/server.ts` (композиция маршрутов), `main.ts` (композиционный корень: Kysely-репозитории, `MoexMarketDataProvider`, JWKS identity-service), `routes/**`, `middleware/**`.

## Запуск

```bash
pnpm --filter @fms/http build && pnpm --filter @fms/http start    # локально
docker compose --profile http up -d http                           # через Docker (Dockerfile.http)
```

Переменные: `POSTGRES_*`, `PORT` (по умолчанию 3000), `IDENTITY_SERVICE_URL` — базовый URL identity-service, ключи берутся с `{IDENTITY_SERVICE_URL}/jwks.json`.

## Swagger / OpenAPI

- `GET /docs` — Swagger UI, `GET /openapi.json` — спецификация OpenAPI 3.0. Обе доступны без токена; запросы из UI всё равно требуют токен: кнопка **Authorize** → значение `Internal <jwt>` целиком, с префиксом.
- Спецификация генерируется из тех же zod-схем, которыми маршруты валидируют вход (`packages/http/src/dto/schemas.ts`, `@asteasolutions/zod-to-openapi`). Список маршрутов с описаниями — `routeSpecs` в `packages/http/src/dto/openapi.ts`; `operationId` = имя use-case'а.
- Расхождение кода и спеки ловят тесты:
  - `openapi.test.ts` — каждый маршрут Express описан в `routeSpecs`, и наоборот;
  - `routes.test.ts` — каждый ответ проверяется на документированный статус и схему тела.

Новый маршрут = схемы в `dto/schemas.ts` + строка в `routeSpecs` + handler в `routes/`.

## Аутентификация и домохозяйство

- Заголовок `Authorization: Internal <jwt>`. Токен — EdDSA, `aud = "financial-management"`, claims `hid` (домохозяйство) и `scope`.
- `scope`: `app:view` — только чтение, `app:edit` — чтение и запись.
- Все маршруты, кроме `/healthz`, работают в домохозяйстве из `hid`; без `hid` — 403. Сделки, операции, приватные бумаги, а также счета и категории, на которые они ссылаются, у другого домохозяйства для запроса не существуют (404).
- **Известное ограничение:** `GET/PATCH /accounts/:id`, `POST /accounts/:id/archive`, `PATCH /categories/:id`, `POST /categories/:id/archive` пока не проверяют, что сущность принадлежит домохозяйству токена.

## Маршруты

| Ресурс | Маршруты |
| --- | --- |
| `/accounts` | `GET /`, `GET /archived`, `GET /:id`, `POST /`, `PATCH /:id`, `POST /:id/archive` |
| `/categories` | `GET /`, `GET /archived`, `POST /`, `PATCH /:id`, `POST /:id/archive` |
| `/securities` | `GET /` (список домохозяйства), `GET /archived`, `GET /by-ticker/:ticker`, `GET /search?q=` (поиск на Мосбирже), `POST /import` `{ secid }`, `POST /` (ручная бумага вне Мосбиржи), `PATCH /:id` (только ручные), `POST /:id/archive`, `GET /:id/quote`, `GET /:id/coupons` |
| `/trades` | `GET /` (`accountId`, `securityId`, `from`, `to`), `POST /buy`, `POST /sell`, `PATCH /:id`, `DELETE /:id` |
| `/transactions` | `GET /` (`accountId`, `from`, `to`), `POST /`, `POST /transfer`, `PATCH /:id`, `DELETE /:id` |
| `/portfolio` | `GET /value` — позиции по всем счетам домохозяйства по текущим ценам |

Бумаги Мосбиржи заводятся через `GET /securities/search` → `POST /securities/import`: реквизиты берутся из MOEX ISS, бумага попадает в общий справочник и в список домохозяйства. Котировки ISS отдаёт с задержкой до 15 минут; облигации — в % от номинала плюс НКД.

## Ошибки

| Код | `error` | Когда |
| --- | --- | --- |
| 400 | `invalid_request` / `invalid_transaction` | невалидное тело/параметры, перевод на тот же счёт |
| 401 | `unauthorized` | нет/невалидный/просроченный токен |
| 403 | `forbidden` | нет нужного `scope`, нет `hid`, правка биржевой бумаги, котировка/купоны не для бумаги Мосбиржи |
| 404 | `not_found` | нет такой сущности или она чужого домохозяйства |
| 409 | `conflict` | дубликат (имя счёта/категории, тикер/ISIN) |
| 503 | `market_data_unavailable` | MOEX ISS недоступен — можно повторить позже |

`/portfolio/value` при недоступности ISS не падает: позиции уходят в `unpriced`, причина — в `quotesError`.

## Тесты

`packages/http/src/__jest__/routes.test.ts` — маршруты на настоящей тестовой БД (`finances_test`, как `@fms/db`), с локально подписанными JWT (`createLocalJWKSet`) и фейковым `MarketDataProvider`, без identity-service и без сети.
