-- Create tables section

-- Table types_securities

CREATE TABLE "types_securities"
(
  "id_type" Smallserial NOT NULL,
  "Name" Character varying(30) NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

ALTER TABLE "types_securities" ADD CONSTRAINT "Unique_Identifier1" PRIMARY KEY ("id_type")
;

-- Table Securities

CREATE TABLE "Securities"
(
  "id_securitie" BigSerial NOT NULL,
  "tiker" Character varying(30) NOT NULL,
  "name" Character varying(30) NOT NULL,
  "total_price" Bigint NOT NULL,
  "id_issuers" Bigint NOT NULL,
  "id_type" Smallint NOT NULL,
  "id_currrency" Integer NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

CREATE INDEX "IX_releases" ON "Securities" ("id_issuers")
;

CREATE INDEX "IX_determines" ON "Securities" ("id_type")
;

CREATE INDEX "IX_traded_in" ON "Securities" ("id_currrency")
;

ALTER TABLE "Securities" ADD CONSTRAINT "pk_securities" PRIMARY KEY ("id_securitie")
;

-- Table currency_directory

CREATE TABLE "currency_directory"
(
  "id_currrency" Serial NOT NULL,
  "code" Character varying(30) NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

ALTER TABLE "currency_directory" ADD CONSTRAINT "pk_currency_directory" PRIMARY KEY ("id_currrency")
;

-- Table operation_types

CREATE TABLE "operation_types"
(
  "id_operation_types" Smallint NOT NULL,
  "name" Character varying(30) NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

ALTER TABLE "operation_types" ADD CONSTRAINT "pk_operation_types" PRIMARY KEY ("id_operation_types")
;

-- Table issuers

CREATE TABLE "issuers"
(
  "id_issuers" BigSerial NOT NULL,
  "name" Character varying(30) NOT NULL,
  "inn" Integer NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

ALTER TABLE "issuers" ADD CONSTRAINT "pk_issuers" PRIMARY KEY ("id_issuers")
;

-- Table participants

CREATE TABLE "participants"
(
  "id_investor" BigSerial NOT NULL,
  "username" Character varying(30) NOT NULL,
  "email" Character varying(30) NOT NULL,
  "telephone" Character varying(30),
  "inn" Character varying(12)
)
WITH (
  autovacuum_enabled=true)
;

ALTER TABLE "participants" ADD CONSTRAINT "Unique_Identifier4" PRIMARY KEY ("id_investor")
;

-- Table account

CREATE TABLE "account"
(
  "id_account" BigSerial NOT NULL,
  "account_number" Character varying(30) NOT NULL,
  "id_investor" Bigint NOT NULL,
  "id_currrency" Integer NOT NULL,
  "id_payments" Bigint NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

CREATE INDEX "IX_has" ON "account" ("id_investor")
;

CREATE INDEX "IX_tied_up" ON "account" ("id_currrency")
;

CREATE INDEX "IX_produced_according_to" ON "account" ("id_payments")
;

ALTER TABLE "account" ADD CONSTRAINT "Unique_Identifier5" PRIMARY KEY ("id_account")
;

-- Table portfolio_of_assets

CREATE TABLE "portfolio_of_assets"
(
  "id_record" BigSerial NOT NULL,
  "quantity" Bigint NOT NULL,
  "average_purchase_price" Integer NOT NULL,
  "id_securitie" Bigint NOT NULL,
  "id_account" Bigint NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

CREATE INDEX "IX_contains" ON "portfolio_of_assets" ("id_securitie")
;

CREATE INDEX "IX_located" ON "portfolio_of_assets" ("id_account")
;

ALTER TABLE "portfolio_of_assets" ADD CONSTRAINT "Unique_Identifier6" PRIMARY KEY ("id_record")
;

-- Table operation_register

CREATE TABLE "operation_register"
(
  "id_operation" BigSerial NOT NULL,
  "quantity" Integer NOT NULL,
  "price" Integer NOT NULL,
  "total_amouunt" Bigint NOT NULL,
  "commision" Integer NOT NULL,
  "operation_date" Timestamp NOT NULL,
  "id_operation_types" Smallint NOT NULL,
  "id_securitie" Bigint NOT NULL,
  "id_account" Bigint NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

CREATE INDEX "IX_determined" ON "operation_register" ("id_operation_types")
;

CREATE INDEX "IX_recorded" ON "operation_register" ("id_securitie")
;

CREATE INDEX "IX_carried_out" ON "operation_register" ("id_account")
;

ALTER TABLE "operation_register" ADD CONSTRAINT "Unique_Identifier7" PRIMARY KEY ("id_operation")
;

-- Table income_payments

CREATE TABLE "income_payments"
(
  "id_payments" BigSerial NOT NULL,
  "amount" Integer NOT NULL,
  "type" Character varying(30) NOT NULL,
  "date" Date NOT NULL,
  "id_securitie" Bigint NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

CREATE INDEX "IX_paid_according_to" ON "income_payments" ("id_securitie")
;

ALTER TABLE "income_payments" ADD CONSTRAINT "Unique_Identifier8" PRIMARY KEY ("id_payments")
;

-- Create foreign keys (relationships) section -------------------------------------------------

ALTER TABLE "operation_register"
  ADD CONSTRAINT "determined"
    FOREIGN KEY ("id_operation_types")
    REFERENCES "operation_types" ("id_operation_types")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "Securities"
  ADD CONSTRAINT "releases"
    FOREIGN KEY ("id_issuers")
    REFERENCES "issuers" ("id_issuers")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "operation_register"
  ADD CONSTRAINT "recorded"
    FOREIGN KEY ("id_securitie")
    REFERENCES "Securities" ("id_securitie")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "portfolio_of_assets"
  ADD CONSTRAINT "contains"
    FOREIGN KEY ("id_securitie")
    REFERENCES "Securities" ("id_securitie")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "Securities"
  ADD CONSTRAINT "determines"
    FOREIGN KEY ("id_type")
    REFERENCES "types_securities" ("id_type")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "account"
  ADD CONSTRAINT "has"
    FOREIGN KEY ("id_investor")
    REFERENCES "participants" ("id_investor")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "operation_register"
  ADD CONSTRAINT "carried_out"
    FOREIGN KEY ("id_account")
    REFERENCES "account" ("id_account")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "account"
  ADD CONSTRAINT "tied_up"
    FOREIGN KEY ("id_currrency")
    REFERENCES "currency_directory" ("id_currrency")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "Securities"
  ADD CONSTRAINT "traded_in"
    FOREIGN KEY ("id_currrency")
    REFERENCES "currency_directory" ("id_currrency")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "income_payments"
  ADD CONSTRAINT "paid_according_to"
    FOREIGN KEY ("id_securitie")
    REFERENCES "Securities" ("id_securitie")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "account"
  ADD CONSTRAINT "produced_according_to"
    FOREIGN KEY ("id_payments")
    REFERENCES "income_payments" ("id_payments")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;

ALTER TABLE "portfolio_of_assets"
  ADD CONSTRAINT "located"
    FOREIGN KEY ("id_account")
    REFERENCES "account" ("id_account")
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
;
