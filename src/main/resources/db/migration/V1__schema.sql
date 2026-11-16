-- ============================================================
-- V1: Схема БД. Учёт ценных бумаг.
-- ============================================================

CREATE TABLE currency_directory (
    id_currency     SERIAL PRIMARY KEY,
    code            VARCHAR(3)  NOT NULL UNIQUE
);

CREATE TABLE types_securities (
    id_type         SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE operation_types (
    id_operation_type SMALLINT PRIMARY KEY,
    name              VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE issuers (
    id_issuer       BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    inn             VARCHAR(12)  NOT NULL UNIQUE
);

CREATE TABLE participants (
    id_investor     BIGSERIAL PRIMARY KEY,
    last_name       VARCHAR(100) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(30),
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    inn             VARCHAR(12)
);

CREATE TABLE account (
    id_account      BIGSERIAL PRIMARY KEY,
    account_number  VARCHAR(30) NOT NULL UNIQUE,
    id_investor     BIGINT      NOT NULL REFERENCES participants(id_investor) ON DELETE RESTRICT,
    id_currency     INT         NOT NULL REFERENCES currency_directory(id_currency) ON DELETE RESTRICT,
    name            VARCHAR(100)
);

CREATE TABLE securities (
    id_security       BIGSERIAL PRIMARY KEY,
    id_issuer         BIGINT      NOT NULL REFERENCES issuers(id_issuer) ON DELETE RESTRICT,
    id_type           SMALLINT    NOT NULL REFERENCES types_securities(id_type) ON DELETE RESTRICT,
    id_currency       INT         NOT NULL REFERENCES currency_directory(id_currency) ON DELETE RESTRICT,
    ticker            VARCHAR(30) NOT NULL,
    isin              VARCHAR(12) UNIQUE,
    name              VARCHAR(255) NOT NULL,
    current_price     NUMERIC(18,4) NOT NULL CHECK (current_price >= 0),
    prev_close_price  NUMERIC(18,4) CHECK (prev_close_price >= 0),
    updated_at        TIMESTAMPTZ,
    session_status    VARCHAR(10) CHECK (session_status IN ('OPEN','CLOSED','BREAK')),
    UNIQUE (ticker, id_currency)
);

CREATE TABLE portfolio_of_assets (
    id_record               BIGSERIAL PRIMARY KEY,
    id_account              BIGINT NOT NULL REFERENCES account(id_account) ON DELETE RESTRICT,
    id_security             BIGINT NOT NULL REFERENCES securities(id_security) ON DELETE RESTRICT,
    quantity                BIGINT NOT NULL CHECK (quantity >= 0),
    average_purchase_price  NUMERIC(18,4) NOT NULL CHECK (average_purchase_price >= 0),
    UNIQUE (id_account, id_security)
);

CREATE TABLE operation_register (
    id_operation       BIGSERIAL PRIMARY KEY,
    id_account         BIGINT NOT NULL REFERENCES account(id_account) ON DELETE RESTRICT,
    id_security        BIGINT REFERENCES securities(id_security) ON DELETE RESTRICT,
    id_operation_type  SMALLINT NOT NULL REFERENCES operation_types(id_operation_type) ON DELETE RESTRICT,
    quantity           BIGINT NOT NULL CHECK (quantity > 0),
    price              NUMERIC(18,4) NOT NULL CHECK (price >= 0),
    total_amount       NUMERIC(18,4) NOT NULL CHECK (total_amount >= 0),
    commission         NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (commission >= 0),
    nkd                NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (nkd >= 0),
    operation_date     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_securities_issuer  ON securities(id_issuer);
CREATE INDEX idx_securities_type    ON securities(id_type);
CREATE INDEX idx_op_account         ON operation_register(id_account);
CREATE INDEX idx_op_security        ON operation_register(id_security);
CREATE INDEX idx_op_date            ON operation_register(operation_date);
CREATE INDEX idx_portfolio_account  ON portfolio_of_assets(id_account);

CREATE TABLE income_payments (
    id_payment   BIGSERIAL PRIMARY KEY,
    id_account   BIGINT NOT NULL REFERENCES account(id_account) ON DELETE RESTRICT,
    id_security  BIGINT NOT NULL REFERENCES securities(id_security) ON DELETE RESTRICT,
    amount       NUMERIC(18,4) NOT NULL CHECK (amount > 0),
    type         VARCHAR(20) NOT NULL CHECK (type IN ('DIVIDEND','COUPON')),
    payment_date DATE NOT NULL
);

CREATE TABLE audit_log (
    id_audit    BIGSERIAL PRIMARY KEY,
    table_name  VARCHAR(50) NOT NULL,
    operation   VARCHAR(10) NOT NULL,
    record_id   BIGINT,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by  VARCHAR(100) DEFAULT current_user,
    old_data    JSONB,
    new_data    JSONB
);