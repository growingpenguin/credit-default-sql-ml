-- ============================================
-- Credit Default Risk Database Schema
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS statements CASCADE;
DROP TABLE IF EXISTS payment_status CASCADE;
DROP TABLE IF EXISTS credit_accounts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. Customers table (demographics)
CREATE TABLE customers (
    customer_id      INTEGER PRIMARY KEY,
    age              INTEGER NOT NULL,
    sex              INTEGER NOT NULL,  -- 1=male, 2=female
    education        INTEGER NOT NULL,  -- 1=grad, 2=univ, 3=high, 4=other
    marriage         INTEGER NOT NULL,  -- 1=married, 2=single, 3=other
    created_date     DATE DEFAULT CURRENT_DATE
);

-- 2. Credit accounts
CREATE TABLE credit_accounts (
    account_id       INTEGER PRIMARY KEY,
    customer_id      INTEGER NOT NULL REFERENCES customers(customer_id),
    credit_limit     NUMERIC(12, 2) NOT NULL,
    open_date        DATE DEFAULT CURRENT_DATE,
    status           VARCHAR(20) DEFAULT 'active'
);

-- 3. Payment status history (PAY_0 to PAY_6)
-- Repayment status: -1=pay duly, 1=delay 1 month, 2=delay 2 months, etc.
CREATE TABLE payment_status (
    status_id        SERIAL PRIMARY KEY,
    account_id       INTEGER NOT NULL REFERENCES credit_accounts(account_id),
    status_month     INTEGER NOT NULL,  -- 0=Sept, 2=Aug, ..., 6=Apr
    repayment_status INTEGER NOT NULL,  -- -1, 0, 1, 2, ..., 8
    UNIQUE(account_id, status_month)
);

-- 4. Monthly statements (BILL_AMT1 to BILL_AMT6)
CREATE TABLE statements (
    statement_id     SERIAL PRIMARY KEY,
    account_id       INTEGER NOT NULL REFERENCES credit_accounts(account_id),
    statement_month  INTEGER NOT NULL,  -- 1=Sept, 2=Aug, ..., 6=Apr
    bill_amount      NUMERIC(12, 2) NOT NULL,
    UNIQUE(account_id, statement_month)
);

-- 5. Monthly payments (PAY_AMT1 to PAY_AMT6)
CREATE TABLE payments (
    payment_id       SERIAL PRIMARY KEY,
    account_id       INTEGER NOT NULL REFERENCES credit_accounts(account_id),
    payment_month    INTEGER NOT NULL,  -- 1=Sept, 2=Aug, ..., 6=Apr
    payment_amount   NUMERIC(12, 2) NOT NULL,
    UNIQUE(account_id, payment_month)
);

-- 6. Target labels
CREATE TABLE labels (
    customer_id      INTEGER PRIMARY KEY REFERENCES customers(customer_id),
    defaulted        BOOLEAN NOT NULL  -- True if defaulted next month
);

-- Create indexes for faster queries
CREATE INDEX idx_accounts_customer ON credit_accounts(customer_id);
CREATE INDEX idx_payment_status_account ON payment_status(account_id);
CREATE INDEX idx_statements_account ON statements(account_id);
CREATE INDEX idx_payments_account ON payments(account_id);
