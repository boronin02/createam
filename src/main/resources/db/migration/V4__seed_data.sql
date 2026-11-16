-- ============================================================
-- V4: Тестовые данные.
-- ============================================================

INSERT INTO currency_directory (code) VALUES
    ('RUB'), ('USD'), ('CNY');

INSERT INTO types_securities (name) VALUES
    ('Акция'), ('Облигация'), ('Пай (ETF)');

INSERT INTO operation_types (id_operation_type, name) VALUES
    (1, 'Покупка'),
    (2, 'Продажа'),
    (3, 'Зачисление'),
    (4, 'Списание');

INSERT INTO issuers (name, inn) VALUES
    ('ПАО Сбербанк', '7707083893'),
    ('ПАО Газпром',  '7710511608');

INSERT INTO participants (last_name, first_name, middle_name, email, phone, username, password_hash, inn) VALUES
    ('Иванов', 'Иван', 'Иванович', 'ivanov@example.com', '+79991112233', 'ivanov', '$2a$10$placeholderhashplaceholderhash', NULL);

INSERT INTO account (account_number, id_investor, id_currency, name) VALUES
    ('4081781050000000001', 1, 1, 'Основной Брокерский'),
    ('4081781050000000002', 1, 1, 'Мой ИИС');

INSERT INTO securities (id_issuer, id_type, id_currency, ticker, isin, name, current_price, prev_close_price, updated_at, session_status) VALUES
    (1, 1, 1, 'SBER', 'RU0009029540', 'Сбербанк - акции обыкновенные', 280.50, 275.00, now(), 'OPEN'),
    (2, 1, 1, 'GAZP', 'RU0007665136', 'Газпром - акции обыкновенные',  162.10, 163.50, now(), 'OPEN');

-- Покупка 100 SBER по 270. Триггер fn_update_portfolio создаст запись в portfolio.
INSERT INTO operation_register (id_account, id_security, id_operation_type, quantity, price, total_amount, commission, operation_date) VALUES
    (1, 1, 1, 100, 270.00, 27000.00, 8.10, '2026-09-01 10:15:00+00');

-- Дивиденд по SBER на счёт 1
INSERT INTO income_payments (id_account, id_security, amount, type, payment_date) VALUES
    (1, 1, 500.00, 'DIVIDEND', '2026-09-15');