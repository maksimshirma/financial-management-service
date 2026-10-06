-- Общий справочник бумаг. Биржевые (owner_household_id IS NULL) наполняются
-- из MOEX ISS и общие для всех домохозяйств; приватные (ручной ввод, вне
-- Мосбиржи) видны только домохозяйству-владельцу.
CREATE TABLE securities (
    security_id        SERIAL PRIMARY KEY,
    ticker             VARCHAR NOT NULL,  -- для биржевых = MOEX SECID
    isin               CHAR(12),
    name               VARCHAR NOT NULL,
    type               security_type NOT NULL,
    currency           currency NOT NULL DEFAULT 'RUB',
    face_value         DECIMAL(14,2),     -- номинал облигации
    coupon_rate        DECIMAL(6,3),      -- % годовых
    maturity_date      DATE,              -- дата погашения
    owner_household_id TEXT,              -- NULL = биржевая бумага
    board_id           VARCHAR,           -- режим торгов MOEX (TQBR, TQOB, ...)
    market             VARCHAR,           -- рынок MOEX (shares, bonds)
    synced_at          TIMESTAMPTZ        -- последняя сверка реквизитов с ISS
);

CREATE UNIQUE INDEX uq_securities_ticker_exchange
    ON securities(ticker) WHERE owner_household_id IS NULL;
CREATE UNIQUE INDEX uq_securities_ticker_private
    ON securities(owner_household_id, ticker) WHERE owner_household_id IS NOT NULL;
CREATE UNIQUE INDEX uq_securities_isin_exchange
    ON securities(isin) WHERE owner_household_id IS NULL;
CREATE UNIQUE INDEX uq_securities_isin_private
    ON securities(owner_household_id, isin) WHERE owner_household_id IS NOT NULL;

-- Список бумаг домохозяйства: что оно импортировало/торговало и что скрыло.
-- Живёт в этом же файле — отдельный 05_*.sql встал бы по алфавиту раньше securities.
CREATE TABLE household_securities (
    household_id TEXT NOT NULL,
    security_id  INT NOT NULL REFERENCES securities(security_id),
    is_archived  BOOLEAN NOT NULL DEFAULT false,
    added_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (household_id, security_id)
);
