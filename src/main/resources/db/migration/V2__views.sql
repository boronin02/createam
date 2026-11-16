-- ============================================================
-- V2: Представления под типовые запросы из отчёта.
-- ============================================================

-- Запрос 1: текущая стоимость портфеля и PnL
CREATE VIEW v_portfolio_pnl AS
SELECT
    pa.id_account,
    a.account_number,
    s.id_security,
    s.ticker,
    s.name AS security_name,
    pa.quantity,
    pa.average_purchase_price,
    s.current_price,
    (pa.quantity * s.current_price) AS current_value,
    ((s.current_price - pa.average_purchase_price) * pa.quantity) AS unrealized_pnl
FROM portfolio_of_assets pa
JOIN account    a ON a.id_account  = pa.id_account
JOIN securities s ON s.id_security = pa.id_security;

-- Запрос 2: история операций по счёту
CREATE VIEW v_operation_history AS
SELECT
    op.id_operation,
    op.operation_date,
    a.account_number,
    ot.name AS operation_type,
    s.ticker,
    s.name AS security_name,
    op.quantity,
    op.price,
    op.total_amount,
    op.commission,
    op.nkd
FROM operation_register op
JOIN operation_types ot ON ot.id_operation_type = op.id_operation_type
JOIN account         a  ON a.id_account          = op.id_account
LEFT JOIN securities s  ON s.id_security         = op.id_security;

-- Запрос 3: сводка по выплатам доходов
CREATE VIEW v_income_summary AS
SELECT
    ip.id_payment,
    ip.payment_date,
    a.account_number,
    s.ticker,
    s.name  AS security_name,
    ip.amount,
    ip.type
FROM income_payments ip
JOIN securities s ON s.id_security = ip.id_security
JOIN account    a ON a.id_account  = ip.id_account;

-- Запрос 4: фильтрация бумаг по типу (расширенная информация)
CREATE VIEW v_securities_detailed AS
SELECT
    s.id_security,
    s.ticker,
    s.isin,
    s.name,
    s.current_price,
    ts.name  AS type_name,
    iss.name AS issuer_name,
    c.code   AS currency_code
FROM securities s
JOIN types_securities  ts  ON ts.id_type    = s.id_type
JOIN issuers           iss ON iss.id_issuer = s.id_issuer
JOIN currency_directory c  ON c.id_currency = s.id_currency;

-- Запрос 5: свежесть рыночных данных
CREATE VIEW v_market_data_freshness AS
SELECT
    s.id_security,
    s.ticker,
    s.name,
    s.updated_at,
    s.session_status,
    CASE
        WHEN s.updated_at IS NULL THEN 'NO_DATA'
        WHEN s.updated_at < now() - INTERVAL '1 day' THEN 'STALE'
        ELSE 'FRESH'
    END AS freshness
FROM securities s;

-- Запрос 6: агрегированные комиссии по дням
CREATE VIEW v_commissions_by_day AS
SELECT
    a.id_account,
    a.account_number,
    date_trunc('day', op.operation_date)::date AS day,
    SUM(op.commission) AS total_commission,
    COUNT(op.id_operation) AS operations_count
FROM operation_register op
JOIN account a ON a.id_account = op.id_account
GROUP BY a.id_account, a.account_number, date_trunc('day', op.operation_date);