CREATE TABLE accounts (
    account_id    SERIAL PRIMARY KEY,
    household_id  TEXT NOT NULL,
    name          VARCHAR NOT NULL,
    type          account_type NOT NULL,
    currency      currency NOT NULL DEFAULT 'RUB',
    is_archived   BOOLEAN NOT NULL DEFAULT false,

    UNIQUE (household_id, name)
);
