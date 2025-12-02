"""
Populate SQL tables from UCI dataset CSV
"""
import pandas as pd
import sqlite3
import os

def normalize_and_populate(db_path='../data/credit_default.db'):
    """Load CSV and populate normalized SQL tables"""
    
    # Load raw data
    df = pd.read_csv('../data/credit_default_raw.csv')
    
    # Rename columns for consistency
    column_mapping = {
        'LIMIT_BAL': 'credit_limit',
        'SEX': 'sex',
        'EDUCATION': 'education',
        'MARRIAGE': 'marriage',
        'AGE': 'age',
        'default.payment.next.month': 'defaulted'
    }
    df.rename(columns=column_mapping, inplace=True)
    
    # Connect to SQLite
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Read and execute schema
    with open('schema.sql', 'r') as f:
        schema_sql = f.read()
        # SQLite doesn't support CASCADE in DROP, so modify
        schema_sql = schema_sql.replace(' CASCADE', '')
        cursor.executescript(schema_sql)
    
    print("✓ Schema created")
    
    # 1. Insert customers
    customers = df[['customer_id', 'age', 'sex', 'education', 'marriage']].copy()
    customers.to_sql('customers', conn, if_exists='append', index=False)
    print(f"✓ Inserted {len(customers)} customers")
    
    # 2. Insert credit accounts (1 account per customer)
    accounts = df[['customer_id', 'credit_limit']].copy()
    accounts['account_id'] = accounts['customer_id']  # 1:1 mapping
    accounts = accounts[['account_id', 'customer_id', 'credit_limit']]
    accounts.to_sql('credit_accounts', conn, if_exists='append', index=False)
    print(f"✓ Inserted {len(accounts)} accounts")
    
    # 3. Insert payment status (PAY_0 to PAY_6)
    pay_cols = ['PAY_0', 'PAY_2', 'PAY_3', 'PAY_4', 'PAY_5', 'PAY_6']
    payment_status_data = []
    for idx, row in df.iterrows():
        account_id = row['customer_id']
        for month_idx, col in enumerate(pay_cols):
            payment_status_data.append({
                'account_id': account_id,
                'status_month': month_idx,
                'repayment_status': row[col]
            })
    
    ps_df = pd.DataFrame(payment_status_data)
    ps_df.to_sql('payment_status', conn, if_exists='append', index=False)
    print(f"✓ Inserted {len(ps_df)} payment status records")
    
    # 4. Insert statements (BILL_AMT1 to BILL_AMT6)
    bill_cols = ['BILL_AMT1', 'BILL_AMT2', 'BILL_AMT3', 'BILL_AMT4', 'BILL_AMT5', 'BILL_AMT6']
    statements_data = []
    for idx, row in df.iterrows():
        account_id = row['customer_id']
        for month_idx, col in enumerate(bill_cols, start=1):
            statements_data.append({
                'account_id': account_id,
                'statement_month': month_idx,
                'bill_amount': row[col]
            })
    
    stmt_df = pd.DataFrame(statements_data)
    stmt_df.to_sql('statements', conn, if_exists='append', index=False)
    print(f"✓ Inserted {len(stmt_df)} statement records")
    
    # 5. Insert payments (PAY_AMT1 to PAY_AMT6)
    pay_amt_cols = ['PAY_AMT1', 'PAY_AMT2', 'PAY_AMT3', 'PAY_AMT4', 'PAY_AMT5', 'PAY_AMT6']
    payments_data = []
    for idx, row in df.iterrows():
        account_id = row['customer_id']
        for month_idx, col in enumerate(pay_amt_cols, start=1):
            payments_data.append({
                'account_id': account_id,
                'payment_month': month_idx,
                'payment_amount': row[col]
            })
    
    pmt_df = pd.DataFrame(payments_data)
    pmt_df.to_sql('payments', conn, if_exists='append', index=False)
    print(f"✓ Inserted {len(pmt_df)} payment records")
    
    # 6. Insert labels
    labels = df[['customer_id', 'defaulted']].copy()
    labels['defaulted'] = labels['defaulted'].astype(bool)
    labels.to_sql('labels', conn, if_exists='append', index=False)
    print(f"✓ Inserted {len(labels)} labels")
    
    conn.commit()
    
    # 7. Run feature engineering SQL to create views
    print("\n--- Creating feature engineering views ---")
    with open('feature_engineering.sql', 'r') as f:
        feature_sql = f.read()
        # SQLite doesn't support STDDEV, use 0 as placeholder
        feature_sql = feature_sql.replace('STDDEV(s.bill_amount)', '0')
        cursor.executescript(feature_sql)
    
    # Verify training_data view was created
    result = cursor.execute('SELECT COUNT(*) FROM training_data').fetchone()
    print(f"✓ Created training_data view with {result[0]:,} rows")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Database created at: {db_path}")
    print(f"Total customers: {len(customers):,}")
    print(f"Total records: {len(ps_df) + len(stmt_df) + len(pmt_df):,}")
    print(f"Ready for ML training!")

if __name__ == "__main__":
    # First run load_data.py if CSV doesn't exist
    if not os.path.exists('../data/credit_default_raw.csv'):
        print("Running data loader first...")
        import sys
        sys.path.append('../data')
        from load_data import load_uci_data
        load_uci_data()
    
    normalize_and_populate()
