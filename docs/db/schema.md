# Схема БД

Источник — SQL-файлы в `db/init/`. Здесь то же самое словами + смысл ограничений.

## ENUM-типы (`01_enums.sql`)

| Тип | Значения |
|---|---|
| `currency` | `RUB`, `USD`, `EUR` |
| `account_type` | `cash`, `card`, `deposit`, `credit`, `broker` |
| `category_type` | `income`, `expense` |
| `security_type` | `stock`, `bond`, `fund` |
| `trade_type` | `buy`, `sell` |

## `users`

| Колонка | Тип | Описание |
|---|---|---|
| `user_id` | SERIAL PK | |
| `name` | VARCHAR NOT NULL | |

Пока однопользовательская модель (в seed — один `Максим`), но `accounts.user_id` уже ссылается на `users`, так что расширение до мульти-пользователя не потребует переделки.

## `accounts`

| Колонка | Тип | Описание |
|---|---|---|
| `account_id` | SERIAL PK | |
| `user_id` | INT NOT NULL FK → `users` | владелец счёта |
| `name` | VARCHAR NOT NULL | |
| `type` | `account_type` NOT NULL | cash/card/deposit/credit/broker |
| `currency` | `currency` NOT NULL DEFAULT `RUB` | |
| `is_archived` | BOOLEAN NOT NULL DEFAULT false | скрыть из активных без удаления истории |

Ограничение: `UNIQUE (user_id, name)` — у одного пользователя не может быть двух счетов с одинаковым именем.

## `categories`

| Колонка | Тип | Описание |
|---|---|---|
| `category_id` | SERIAL PK | |
| `name` | VARCHAR NOT NULL UNIQUE | глобальный справочник, не привязан к пользователю |
| `type` | `category_type` NOT NULL | income/expense |

## `securities`

Общий справочник финансовых инструментов (акции, облигации, фонды) для брокерских операций. Не принадлежит домохозяйству: одна строка на бумагу для всех.

- **Биржевые** (`owner_household_id IS NULL`) — заводятся только через `import-security`, реквизиты берутся из MOEX ISS (`@fms/moex`), руками не редактируются.
- **Приватные** (`owner_household_id` = hid) — ручной ввод через `create-security` для бумаг вне Мосбиржи, видны только владельцу.

| Колонка | Тип | Описание |
|---|---|---|
| `security_id` | SERIAL PK | |
| `ticker` | VARCHAR NOT NULL | для биржевых — MOEX SECID (`SBER`, `SU26238RMFS4`) |
| `isin` | CHAR(12) | опционально |
| `name` | VARCHAR NOT NULL | |
| `type` | `security_type` NOT NULL | stock/bond/fund |
| `currency` | `currency` NOT NULL DEFAULT `RUB` | |
| `face_value` | DECIMAL(14,2) | номинал облигации, NULL для акций/фондов |
| `coupon_rate` | DECIMAL(6,3) | % годовых, только для облигаций |
| `maturity_date` | DATE | дата погашения, только для облигаций |
| `owner_household_id` | TEXT | NULL — биржевая бумага, иначе домохозяйство-владелец |
| `board_id` | VARCHAR | режим торгов MOEX (`TQBR`, `TQOB`), нужен для котировок |
| `market` | VARCHAR | рынок MOEX (`shares`, `bonds`) |
| `synced_at` | TIMESTAMPTZ | последняя сверка реквизитов с ISS |

Уникальность — частичными индексами, отдельно для биржевых и для приватных бумаг:

- `uq_securities_ticker_exchange (ticker) WHERE owner_household_id IS NULL`;
- `uq_securities_ticker_private (owner_household_id, ticker) WHERE owner_household_id IS NOT NULL`;
- то же для `isin` (`uq_securities_isin_exchange`, `uq_securities_isin_private`).

## `household_securities`

Список бумаг домохозяйства: что оно импортировало, создало или торговало. Через него строятся `list-securities` / `list-archived-securities`, на нём же архивирование — справочник при этом не трогается и у других домохозяйств ничего не меняется.

| Колонка | Тип | Описание |
|---|---|---|
| `household_id` | TEXT NOT NULL | PK (вместе с `security_id`) |
| `security_id` | INT NOT NULL FK → `securities` | |
| `is_archived` | BOOLEAN NOT NULL DEFAULT false | скрыть из активных без удаления истории |
| `added_at` | TIMESTAMPTZ NOT NULL DEFAULT now() | |

Строка появляется при `import-security`, `create-security` и при первой сделке с бумагой; повторное добавление снимает архив.

## `transactions`

Единая лента операций: доходы, расходы, переводы между своими счетами, дивиденды и купоны.

| Колонка | Тип | Описание |
|---|---|---|
| `transaction_id` | SERIAL PK | |
| `date` | DATE NOT NULL | |
| `account_id` | INT NOT NULL FK → `accounts` | счёт списания/зачисления |
| `amount` | DECIMAL(14,2) NOT NULL | всегда положительная |
| `category_id` | INT FK → `categories` | NULL у переводов |
| `is_transfer` | BOOLEAN NOT NULL DEFAULT false | |
| `to_account_id` | INT FK → `accounts` | только для переводов — счёт назначения |
| `to_amount` | DECIMAL(14,2) | сумма зачисления при переводе между разными валютами |
| `security_id` | INT FK → `securities` | для дивидендов/купонов — источник дохода |
| `note` | TEXT | |

Constraints:

- `chk_transfer_or_category` — жёсткое разделение двух режимов строки:
  - перевод: `is_transfer = true`, `category_id IS NULL`, `to_account_id IS NOT NULL`;
  - доход/расход: `is_transfer = false`, `category_id IS NOT NULL`, `to_account_id IS NULL`, `to_amount IS NULL`.
- `chk_self_transfer` — `to_account_id <> account_id` (перевод не сам на себя).
- `chk_amount` — `amount > 0`.
- `chk_to_amount` — `to_amount > 0` (если задано).

Индексы: `idx_transactions_date (date)`, `idx_transactions_account_id (account_id)` — под выборки по периоду и по счёту.

Дивиденды/купоны — обычная строка с `category_id` = «Дивиденды»/«Купоны» и заполненным `security_id`, отдельной таблицы для них нет.

## `trades`

Сделки по бумагам на брокерском счёте.

| Колонка | Тип | Описание |
|---|---|---|
| `trade_id` | SERIAL PK | |
| `date` | DATE NOT NULL | |
| `account_id` | INT NOT NULL FK → `accounts` | брокерский счёт |
| `security_id` | INT NOT NULL FK → `securities` | |
| `type` | `trade_type` NOT NULL | buy/sell |
| `quantity` | DECIMAL(18,6) NOT NULL | количество бумаг |
| `price` | DECIMAL(14,4) NOT NULL | цена за одну бумагу |
| `accrued_interest` | DECIMAL(14,2) NOT NULL DEFAULT 0 | НКД по облигациям |
| `fee` | DECIMAL(14,2) NOT NULL DEFAULT 0 | комиссия брокера |

Constraints: `quantity > 0`, `price >= 0`, `fee >= 0`, `accrued_interest >= 0`.

Индекс: `idx_trades_account_security (account_id, security_id)` — под расчёт текущей позиции по бумаге на счёте.

`account_type` для строки `trades.account_id` семантически должен быть `broker`, но на уровне БД это не проверяется (нет CHECK/триггера) — контроль на стороне приложения.

## Расчётные величины, которых нет в схеме напрямую

- **Баланс счёта** — не хранится, считается суммированием `transactions` (с учётом знака: приход/расход/перевод туда-обратно).
- **Позиция по бумаге** (сколько штук держим) — агрегация `trades` (`buy` − `sell`) по `account_id + security_id`.
- **Средняя цена входа / P&L** — считается из истории `trades`, отдельного поля под текущую цену/стоимость позиции нет.
