-- ============================================
-- Feature Engineering Queries
-- ============================================

-- Create feature view combining all SQL-engineered features
DROP VIEW IF EXISTS customer_features;
DROP VIEW IF EXISTS account_features;

-- Step 1: Account-level features
CREATE VIEW account_features AS
WITH 
-- Payment behavior aggregations
payment_behavior AS (
    SELECT 
        ps.account_id,
        AVG(ps.repayment_status) AS avg_repay_status_6m,
        MAX(ps.repayment_status) AS max_delay_months,
        SUM(CASE WHEN ps.repayment_status > 0 THEN 1 ELSE 0 END) AS num_late_payments,
        SUM(CASE WHEN ps.repayment_status >= 2 THEN 1 ELSE 0 END) AS num_serious_delays
    FROM payment_status ps
    GROUP BY ps.account_id
),
-- Statement and payment aggregations
financial_behavior AS (
    SELECT 
        s.account_id,
        AVG(s.bill_amount) AS avg_bill_6m,
        MAX(s.bill_amount) AS max_bill_6m,
        MIN(s.bill_amount) AS min_bill_6m,
        STDDEV(s.bill_amount) AS std_bill_6m,
        AVG(p.payment_amount) AS avg_payment_6m,
        SUM(p.payment_amount) AS total_paid_6m,
        -- Payment ratio (how much of bill was paid)
        AVG(CASE 
            WHEN s.bill_amount > 0 THEN p.payment_amount / s.bill_amount 
            ELSE 1.0 
        END) AS avg_payment_ratio
    FROM statements s
    JOIN payments p ON s.account_id = p.account_id 
                    AND s.statement_month = p.payment_month
    GROUP BY s.account_id
),
-- Utilization trends
utilization_calc AS (
    SELECT 
        s.account_id,
        AVG(s.bill_amount / NULLIF(ca.credit_limit, 0)) AS avg_utilization_6m,
        MAX(s.bill_amount / NULLIF(ca.credit_limit, 0)) AS max_utilization_6m
    FROM statements s
    JOIN credit_accounts ca ON s.account_id = ca.account_id
    GROUP BY s.account_id, ca.credit_limit
)
SELECT 
    ca.account_id,
    ca.customer_id,
    ca.credit_limit,
    pb.avg_repay_status_6m,
    pb.max_delay_months,
    pb.num_late_payments,
    pb.num_serious_delays,
    fb.avg_bill_6m,
    fb.max_bill_6m,
    fb.std_bill_6m,
    fb.avg_payment_6m,
    fb.total_paid_6m,
    fb.avg_payment_ratio,
    uc.avg_utilization_6m,
    uc.max_utilization_6m
FROM credit_accounts ca
JOIN payment_behavior pb ON ca.account_id = pb.account_id
JOIN financial_behavior fb ON ca.account_id = fb.account_id
JOIN utilization_calc uc ON ca.account_id = uc.account_id;

-- Step 2: Customer-level features (aggregate accounts if multiple)
CREATE VIEW customer_features AS
SELECT 
    c.customer_id,
    c.age,
    c.sex,
    c.education,
    c.marriage,
    COUNT(DISTINCT af.account_id) AS num_accounts,
    SUM(af.credit_limit) AS total_credit_limit,
    AVG(af.avg_repay_status_6m) AS avg_repay_status,
    MAX(af.max_delay_months) AS max_delay_ever,
    SUM(af.num_late_payments) AS total_late_payments,
    SUM(af.num_serious_delays) AS total_serious_delays,
    AVG(af.avg_bill_6m) AS avg_bill,
    AVG(af.avg_payment_6m) AS avg_payment,
    AVG(af.avg_payment_ratio) AS avg_pay_ratio,
    AVG(af.avg_utilization_6m) AS avg_utilization,
    MAX(af.max_utilization_6m) AS max_utilization
FROM customers c
JOIN account_features af ON c.customer_id = af.customer_id
GROUP BY c.customer_id, c.age, c.sex, c.education, c.marriage;

-- Step 3: Training data view (features + labels)
DROP VIEW IF EXISTS training_data;
CREATE VIEW training_data AS
SELECT 
    cf.*,
    CAST(l.defaulted AS INTEGER) AS default_label
FROM customer_features cf
JOIN labels l ON cf.customer_id = l.customer_id;

-- Query to verify feature distribution
SELECT 
    COUNT(*) AS total_customers,
    SUM(default_label) AS num_defaults,
    ROUND(AVG(default_label) * 100, 2) AS default_rate_pct,
    ROUND(AVG(avg_utilization), 4) AS avg_util,
    ROUND(AVG(total_late_payments), 2) AS avg_late_pmts
FROM training_data;
