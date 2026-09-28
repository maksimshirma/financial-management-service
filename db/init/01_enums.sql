CREATE TYPE currency AS ENUM ('RUB', 'USD', 'EUR');
CREATE TYPE account_type AS ENUM ('cash', 'card', 'deposit', 'credit', 'broker');
CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE security_type AS ENUM ('stock', 'bond', 'fund');
CREATE TYPE trade_type AS ENUM ('buy', 'sell');
