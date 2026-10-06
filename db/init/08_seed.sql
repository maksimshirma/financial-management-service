-- ===== Счета =====
INSERT INTO accounts (user_id, name, type, currency) VALUES
    (1, 'Наличные',            'cash',    'RUB'),
    (1, 'Дебетовая карта',     'card',    'RUB'),
    (1, 'Вклад в банке',       'deposit', 'RUB'),
    (1, 'Кредитка',            'credit',  'RUB'),
    (1, 'Брокерский счёт',     'broker',  'RUB'),
    (1, 'Валютная карта',      'card',    'USD');

-- ===== Категории =====
INSERT INTO categories (name, type) VALUES
    ('Зарплата',    'income'),
    ('Фриланс',     'income'),
    ('Дивиденды',   'income'),
    ('Купоны',      'income'),
    ('Еда',         'expense'),
    ('Транспорт',   'expense'),
    ('Жильё',       'expense'),
    ('Развлечения', 'expense'),
    ('Здоровье',    'expense');

-- ===== Бумаги =====
INSERT INTO securities (ticker, isin, name, type, currency, face_value, coupon_rate, maturity_date) VALUES
    ('SBER', 'RU0009029540', 'Сбербанк',           'stock', 'RUB', NULL,   NULL,  NULL),
    ('LQDT', 'RU000A101X76', 'Ликвидность (фонд)', 'fund',  'RUB', NULL,   NULL,  NULL),
    ('SU26238', 'RU000A1038V6', 'ОФЗ 26238',        'bond',  'RUB', 1000.00, 7.100, '2041-05-15');

-- ===== Транзакции: доходы и расходы =====
INSERT INTO transactions (date, account_id, amount, category_id, is_transfer, note) VALUES
    ('2026-09-05', 2, 150000.00, 1, false, 'Зарплата за август'),
    ('2026-09-06', 2,   3500.00, 5, false, 'Продукты, Пятёрочка'),
    ('2026-09-07', 2,    800.00, 6, false, 'Метро, проездной'),
    ('2026-09-10', 2,  35000.00, 7, false, 'Аренда квартиры'),
    ('2026-09-12', 1,   1200.00, 8, false, 'Кино с друзьями'),
    ('2026-09-15', 2,  25000.00, 2, false, 'Фриланс-проект');

-- ===== Транзакция-перевод (между своими счетами) =====
INSERT INTO transactions (date, account_id, amount, is_transfer, to_account_id, note) VALUES
    ('2026-09-16', 2, 20000.00, true, 5, 'Пополнение брокерского счёта');

-- ===== Дивиденды и купоны (привязаны к бумаге через security_id) =====
INSERT INTO transactions (date, account_id, amount, category_id, is_transfer, security_id, note) VALUES
    ('2026-09-20', 5,  450.00, 3, false, 1, 'Дивиденды SBER'),
    ('2026-09-22', 5, 3550.00, 4, false, 3, 'Купон ОФЗ 26238');

-- ===== Сделки на брокерском счёте =====
INSERT INTO trades (date, account_id, security_id, type, quantity, price, accrued_interest, fee) VALUES
    ('2026-09-16', 5, 1, 'buy',  50,     280.5000,   0.00, 15.00),
    ('2026-09-18', 5, 2, 'buy', 100,     1.2345,     0.00,  0.50),
    ('2026-09-19', 5, 3, 'buy',  10,   990.0000,    45.20,  5.00);
    