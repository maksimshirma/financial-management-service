CREATE TABLE securities (
    security_id   SERIAL PRIMARY KEY,
    ticker        VARCHAR NOT NULL UNIQUE,
    isin          CHAR(12) UNIQUE,
    name          VARCHAR NOT NULL,
    type          security_type NOT NULL,
    currency      currency NOT NULL DEFAULT 'RUB',
    face_value    DECIMAL(14,2),  -- номинал облигации
    coupon_rate   DECIMAL(6,3),   -- % годовых
    maturity_date DATE,            -- дата погашения
    is_archived BOOLEAN NOT NULL DEFAULT false
);
