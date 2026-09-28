CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    date           DATE NOT NULL,
    account_id     INT NOT NULL REFERENCES accounts(account_id),      -- откуда списали / куда пришло
    amount         DECIMAL(14,2) NOT NULL,                            -- всегда положительная
    category_id    INT REFERENCES categories(category_id),            -- пусто у переводов
    is_transfer    BOOLEAN NOT NULL DEFAULT false,
    to_account_id  INT REFERENCES accounts(account_id),               -- только для переводов
    to_amount      DECIMAL(14,2),                                     -- сколько пришло (перевод между валютами)
    security_id    INT REFERENCES securities(security_id),            -- для дивидендов и купонов
    note           TEXT,

    CONSTRAINT chk_transfer_or_category CHECK (
        (is_transfer AND category_id IS NULL
            AND to_account_id IS NOT NULL)
        OR
        (NOT is_transfer AND category_id IS NOT NULL
            AND to_account_id IS NULL
            AND to_amount IS NULL)
    ),
    CONSTRAINT chk_self_transfer CHECK (to_account_id <> account_id),
    CONSTRAINT chk_amount CHECK (amount > 0),
    CONSTRAINT chk_to_amount CHECK (to_amount > 0)
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
