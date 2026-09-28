CREATE TABLE trades (
    trade_id          SERIAL PRIMARY KEY,
    date              DATE NOT NULL,
    account_id        INT NOT NULL REFERENCES accounts(account_id),    -- брокерский счёт
    security_id       INT NOT NULL REFERENCES securities(security_id),
    type              trade_type NOT NULL,
    quantity          DECIMAL(18,6) NOT NULL,
    price             DECIMAL(14,4) NOT NULL,                          -- цена за 1 бумагу
    accrued_interest  DECIMAL(14,2) NOT NULL DEFAULT 0,                -- НКД по облигациям
    fee               DECIMAL(14,2) NOT NULL DEFAULT 0,                -- комиссия брокера

    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_fee CHECK (fee >= 0),
    CONSTRAINT chk_accrued_interest CHECK (accrued_interest >= 0)
);

CREATE INDEX idx_trades_account_security ON trades(account_id, security_id);
