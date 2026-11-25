-- 1. Удаляем старые триггеры, работавшие только на INSERT
DROP TRIGGER IF EXISTS trg_check_sell_quantity ON operation_register;
DROP TRIGGER IF EXISTS trg_update_portfolio ON operation_register;
DROP FUNCTION IF EXISTS fn_check_sell_quantity();
DROP FUNCTION IF EXISTS fn_update_portfolio();

-- 2. Вспомогательная функция пересчета позиции по конкретному счету и бумаге
CREATE OR REPLACE FUNCTION fn_recalculate_portfolio_item(p_account_id BIGINT, p_security_id BIGINT)
RETURNS VOID AS $$
DECLARE
    rec       RECORD;
    v_qty     BIGINT := 0;
    v_avg     NUMERIC(18,4) := 0;
BEGIN
    IF p_account_id IS NULL OR p_security_id IS NULL THEN
        RETURN;
    END IF;

    -- Проходим по всем операциям в хронологическом порядке
    FOR rec IN
        SELECT op.quantity, op.price, ot.name AS op_name
        FROM operation_register op
        JOIN operation_types ot ON ot.id_operation_type = op.id_operation_type
        WHERE op.id_account = p_account_id
          AND op.id_security = p_security_id
        ORDER BY op.operation_date ASC, op.id_operation ASC
    LOOP
        IF rec.op_name IN ('Покупка', 'Зачисление') THEN
            v_avg := ((v_qty * v_avg) + (rec.quantity * rec.price)) / (v_qty + rec.quantity);
            v_qty := v_qty + rec.quantity;
        ELSIF rec.op_name IN ('Продажа', 'Списание') THEN
            IF v_qty < rec.quantity THEN
                RAISE EXCEPTION 'Недостаточно бумаг на счёте % для операции (доступно %, требуется %)',
                    p_account_id, v_qty, rec.quantity;
            END IF;
            v_qty := v_qty - rec.quantity;
            IF v_qty = 0 THEN
                v_avg := 0;
            END IF;
        END IF;
    END LOOP;

    -- Обновляем или удаляем запись в портфеле
    IF v_qty > 0 THEN
        INSERT INTO portfolio_of_assets (id_account, id_security, quantity, average_purchase_price)
        VALUES (p_account_id, p_security_id, v_qty, v_avg)
        ON CONFLICT (id_account, id_security)
        DO UPDATE SET quantity               = EXCLUDED.quantity,
                      average_purchase_price = EXCLUDED.average_purchase_price;
    ELSE
        DELETE FROM portfolio_of_assets
        WHERE id_account = p_account_id AND id_security = p_security_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Триггерная функция на INSERT, UPDATE и DELETE
CREATE OR REPLACE FUNCTION fn_sync_portfolio_on_operation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM fn_recalculate_portfolio_item(OLD.id_account, OLD.id_security);
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM fn_recalculate_portfolio_item(NEW.id_account, NEW.id_security);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Если при редактировании изменили счет или бумагу, пересчитываем и старую, и новую пару
        IF OLD.id_account IS DISTINCT FROM NEW.id_account OR OLD.id_security IS DISTINCT FROM NEW.id_security THEN
            PERFORM fn_recalculate_portfolio_item(OLD.id_account, OLD.id_security);
        END IF;
        PERFORM fn_recalculate_portfolio_item(NEW.id_account, NEW.id_security);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_portfolio_on_operation
AFTER INSERT OR UPDATE OR DELETE ON operation_register
FOR EACH ROW EXECUTE FUNCTION fn_sync_portfolio_on_operation();
