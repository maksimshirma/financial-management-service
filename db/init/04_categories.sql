CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name        VARCHAR NOT NULL UNIQUE,
    type        category_type NOT NULL,  -- income или expense
    is_archived BOOLEAN NOT NULL DEFAULT false
);
