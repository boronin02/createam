-- ============================================================
-- V3: Триггеры и функции.
-- ============================================================

-- 1. Аудит операций
CREATE OR REPLACE FUNCTION fn_audit_operation() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id_operation, OLD.id_operation),
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_operation
AFTER INSERT OR UPDATE OR DELETE ON operation_register
FOR EACH ROW EXECUTE FUNCTION fn_audit_operation();

-- 2. Запрет продажи больше, чем есть в портфеле
CREATE OR REPLACE FUNCTION fn_check_sell_quantity() RETURNS TRIGGER AS $$
DECLARE
    v_op_name   VARCHAR(30);
    v_available BIGINT;
BEGIN
    -- Ищем название операции
    SELECT name INTO v_op_name
    FROM operation_types WHERE id_operation_type = NEW.id_operation_type;

    IF v_op_name = 'Продажа' AND NEW.id_security IS NOT NULL THEN
        SELECT COALESCE(quantity, 0) INTO v_available
        FROM portfolio_of_assets
        WHERE id_account = NEW.id_account AND id_security = NEW.id_security;

        IF v_available < NEW.quantity THEN
            RAISE EXCEPTION 'Недостаточно бумаг для продажи: доступно %, запрошено %',
                v_available, NEW.quantity;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_sell_quantity
BEFORE INSERT ON operation_register
FOR EACH ROW EXECUTE FUNCTION fn_check_sell_quantity();

-- 3. Автообновление портфеля при операции
CREATE OR REPLACE FUNCTION fn_update_portfolio() RETURNS TRIGGER AS $$
DECLARE
    v_op_name  VARCHAR(30);
    v_old_qty  BIGINT;
    v_old_avg  NUMERIC(18,4);
    v_new_qty  BIGINT;
    v_new_avg  NUMERIC(18,4);
BEGIN
    IF NEW.id_security IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT name INTO v_op_name
    FROM operation_types WHERE id_operation_type = NEW.id_operation_type;

    SELECT quantity, average_purchase_price
      INTO v_old_qty, v_old_avg
      FROM portfolio_of_assets
     WHERE id_account = NEW.id_account AND id_security = NEW.id_security;

    IF NOT FOUND THEN
        v_old_qty := 0;
        v_old_avg := 0;
    END IF;

    IF v_op_name = 'Покупка' THEN
        v_new_qty := v_old_qty + NEW.quantity;
        v_new_avg := CASE
            WHEN v_new_qty > 0
                THEN (v_old_qty * v_old_avg + NEW.quantity * NEW.price) / v_new_qty
            ELSE 0
        END;
    ELSIF v_op_name = 'Продажа' THEN
        v_new_qty := v_old_qty - NEW.quantity;
        v_new_avg := v_old_avg;
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO portfolio_of_assets (id_account, id_security, quantity, average_purchase_price)
    VALUES (NEW.id_account, NEW.id_security, v_new_qty, v_new_avg)
    ON CONFLICT (id_account, id_security)
    DO UPDATE SET quantity               = EXCLUDED.quantity,
                  average_purchase_price = EXCLUDED.average_purchase_price;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_portfolio
AFTER INSERT ON operation_register
FOR EACH ROW EXECUTE FUNCTION fn_update_portfolio();

-- 4. Функция для расчета комиссий за период (параметризованная)
CREATE OR REPLACE FUNCTION fn_commissions_between(
    p_account_id BIGINT,
    p_from       TIMESTAMPTZ,
    p_to         TIMESTAMPTZ
) RETURNS TABLE (
    account_number   VARCHAR,
    total_commission NUMERIC,
    operations_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.account_number,
        COALESCE(SUM(op.commission), 0),
        COUNT(op.id_operation)
    FROM account a
    LEFT JOIN operation_register op
           ON op.id_account = a.id_account
          AND op.operation_date BETWEEN p_from AND p_to
    WHERE a.id_account = p_account_id
    GROUP BY a.account_number;
END;
$$ LANGUAGE plpgsql;