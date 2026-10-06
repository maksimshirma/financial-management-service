CREATE TABLE categories (
    category_id  SERIAL PRIMARY KEY,
    household_id TEXT NOT NULL,
    name         VARCHAR NOT NULL,
    type         category_type NOT NULL,  -- income или expense
    is_archived  BOOLEAN NOT NULL DEFAULT false,

    UNIQUE (household_id, name)
);
