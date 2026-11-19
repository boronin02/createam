-- Обновляем View для бумаг, добавляя расчет изменения за день
DROP VIEW IF EXISTS v_securities_detailed;

CREATE VIEW v_securities_detailed AS
SELECT
    s.id_security,
    s.ticker,
    s.isin,
    s.name,
    s.current_price,
    s.prev_close_price,
    -- Изменение в рублях
    (s.current_price - s.prev_close_price) AS daily_change_rub,
    -- Изменение в процентах (защита от деления на ноль)
    CASE
        WHEN s.prev_close_price > 0 THEN ((s.current_price - s.prev_close_price) / s.prev_close_price) * 100
        ELSE 0
    END AS daily_change_percent,
    ts.name  AS type_name,
    iss.name AS issuer_name,
    c.code   AS currency_code
FROM securities s
JOIN types_securities  ts  ON ts.id_type    = s.id_type
JOIN issuers           iss ON iss.id_issuer = s.id_issuer
JOIN currency_directory c  ON c.id_currency = s.id_currency;

-- View для сводки по портфелю (Общая стоимость и PnL)
CREATE VIEW v_portfolio_summary AS
SELECT
    id_account,
    COUNT(id_security) AS total_assets,
    SUM(current_value) AS total_value,
    SUM(unrealized_pnl) AS total_pnl
FROM v_portfolio_pnl
GROUP BY id_account;