CREATE TABLE accounts (
    account_id  SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(user_id),
    name        VARCHAR NOT NULL,
    type        account_type NOT NULL,
    currency    currency NOT NULL DEFAULT 'RUB',
    is_archived BOOLEAN NOT NULL DEFAULT false,

    UNIQUE (user_id, name)
);
