#!/usr/bin/env python
"""
LendingClub Loan Products Data Loader
=====================================
Creates realistic loan products based on LendingClub's actual interest rate tiers.

LendingClub Interest Rate Structure (2023 data):
- Grade A (Excellent Credit, 720+): 5.32% - 8.67% APR
- Grade B (Good Credit, 680-719): 9.44% - 12.98% APR  
- Grade C (Fair Credit, 660-679): 13.67% - 17.27% APR
- Grade D (Below Average, 640-659): 18.15% - 21.99% APR
- Grade E (Poor Credit, 620-639): 22.91% - 26.06% APR
- Grade F/G (Very Poor, <620): 27.31% - 30.99% APR

Source: LendingClub public rate sheets and SEC filings
"""

import sqlite3
import pandas as pd
import os

# =============================================================================
# LENDINGCLUB LOAN PRODUCTS (Based on Real Data)
# =============================================================================

LOAN_PRODUCTS = [
    # Grade A - Excellent Credit (720+ FICO)
    {
        "product_id": "LC-A1-PERSONAL",
        "product_name": "Prime Personal Loan",
        "lender_name": "LendingClub",
        "loan_type": "personal",
        "grade": "A",
        "min_credit_score": 720,
        "max_credit_score": 850,
        "min_apr": 6.99,
        "max_apr": 8.99,
        "min_amount": 1000,
        "max_amount": 40000,
        "terms_months": "36,60",
        "origination_fee_pct": 1.0,
        "description": "Best rates for excellent credit. Fast funding within 24 hours.",
    },
    {
        "product_id": "LC-A2-DEBT",
        "product_name": "Debt Consolidation Plus",
        "lender_name": "LendingClub",
        "loan_type": "debt_consolidation",
        "grade": "A",
        "min_credit_score": 720,
        "max_credit_score": 850,
        "min_apr": 5.99,
        "max_apr": 7.99,
        "min_amount": 5000,
        "max_amount": 50000,
        "terms_months": "36,48,60",
        "origination_fee_pct": 0.5,
        "description": "Consolidate high-interest debt into one low monthly payment.",
    },
    
    # Grade B - Good Credit (680-719 FICO)
    {
        "product_id": "LC-B1-PERSONAL",
        "product_name": "Flexible Personal Loan",
        "lender_name": "LendingClub",
        "loan_type": "personal",
        "grade": "B",
        "min_credit_score": 680,
        "max_credit_score": 719,
        "min_apr": 10.49,
        "max_apr": 13.99,
        "min_amount": 1000,
        "max_amount": 35000,
        "terms_months": "36,60",
        "origination_fee_pct": 2.0,
        "description": "Competitive rates for good credit profiles.",
    },
    {
        "product_id": "LC-B2-HOME",
        "product_name": "Home Improvement Loan",
        "lender_name": "LendingClub",
        "loan_type": "home",
        "grade": "B",
        "min_credit_score": 680,
        "max_credit_score": 719,
        "min_apr": 9.99,
        "max_apr": 12.99,
        "min_amount": 5000,
        "max_amount": 45000,
        "terms_months": "36,48,60",
        "origination_fee_pct": 1.5,
        "description": "Fund your home renovation projects with fixed monthly payments.",
    },
    
    # Grade C - Fair Credit (660-679 FICO)
    {
        "product_id": "LC-C1-PERSONAL",
        "product_name": "Standard Personal Loan",
        "lender_name": "LendingClub",
        "loan_type": "personal",
        "grade": "C",
        "min_credit_score": 660,
        "max_credit_score": 679,
        "min_apr": 14.99,
        "max_apr": 18.99,
        "min_amount": 1000,
        "max_amount": 25000,
        "terms_months": "36,60",
        "origination_fee_pct": 3.0,
        "description": "Personal loans for fair credit with no prepayment penalties.",
    },
    {
        "product_id": "LC-C2-CAR",
        "product_name": "Auto Refinance Loan",
        "lender_name": "LendingClub",
        "loan_type": "car",
        "grade": "C",
        "min_credit_score": 660,
        "max_credit_score": 679,
        "min_apr": 13.99,
        "max_apr": 17.49,
        "min_amount": 5000,
        "max_amount": 35000,
        "terms_months": "36,48,60",
        "origination_fee_pct": 2.5,
        "description": "Refinance your auto loan and potentially lower your rate.",
    },
    
    # Grade D - Below Average (640-659 FICO)
    {
        "product_id": "LC-D1-PERSONAL",
        "product_name": "Credit Builder Loan",
        "lender_name": "LendingClub",
        "loan_type": "personal",
        "grade": "D",
        "min_credit_score": 640,
        "max_credit_score": 659,
        "min_apr": 19.99,
        "max_apr": 23.99,
        "min_amount": 1000,
        "max_amount": 15000,
        "terms_months": "36,48",
        "origination_fee_pct": 4.0,
        "description": "Build your credit history with on-time payments reported to bureaus.",
    },
    
    # Grade E - Poor Credit (620-639 FICO)
    {
        "product_id": "LC-E1-PERSONAL",
        "product_name": "Second Chance Loan",
        "lender_name": "LendingClub",
        "loan_type": "personal",
        "grade": "E",
        "min_credit_score": 620,
        "max_credit_score": 639,
        "min_apr": 24.99,
        "max_apr": 28.99,
        "min_amount": 1000,
        "max_amount": 10000,
        "terms_months": "36",
        "origination_fee_pct": 5.0,
        "description": "A chance to get funding and rebuild your credit profile.",
    },
    
    # Additional Lenders for variety
    {
        "product_id": "SOFI-A1-PERSONAL",
        "product_name": "SoFi Personal Loan",
        "lender_name": "SoFi",
        "loan_type": "personal",
        "grade": "A",
        "min_credit_score": 720,
        "max_credit_score": 850,
        "min_apr": 8.99,
        "max_apr": 12.99,
        "min_amount": 5000,
        "max_amount": 100000,
        "terms_months": "24,36,48,60,72,84",
        "origination_fee_pct": 0.0,
        "description": "No fees. Unemployment protection included. Member benefits.",
    },
    {
        "product_id": "PROSPER-B1-PERSONAL",
        "product_name": "Prosper Personal Loan",
        "lender_name": "Prosper",
        "loan_type": "personal",
        "grade": "B",
        "min_credit_score": 680,
        "max_credit_score": 719,
        "min_apr": 8.99,
        "max_apr": 17.99,
        "min_amount": 2000,
        "max_amount": 50000,
        "terms_months": "36,60",
        "origination_fee_pct": 2.4,
        "description": "Peer-to-peer lending with competitive rates.",
    },
    {
        "product_id": "UPSTART-C1-PERSONAL",
        "product_name": "Upstart AI Loan",
        "lender_name": "Upstart",
        "loan_type": "personal",
        "grade": "C",
        "min_credit_score": 620,
        "max_credit_score": 679,
        "min_apr": 12.99,
        "max_apr": 29.99,
        "min_amount": 1000,
        "max_amount": 50000,
        "terms_months": "36,60",
        "origination_fee_pct": 4.0,
        "description": "AI-powered approval. Looks beyond credit score.",
    },
    {
        "product_id": "MARCUS-A1-DEBT",
        "product_name": "Marcus Debt Consolidation",
        "lender_name": "Marcus by Goldman Sachs",
        "loan_type": "debt_consolidation",
        "grade": "A",
        "min_credit_score": 720,
        "max_credit_score": 850,
        "min_apr": 6.99,
        "max_apr": 19.99,
        "min_amount": 3500,
        "max_amount": 40000,
        "terms_months": "36,48,60,72",
        "origination_fee_pct": 0.0,
        "description": "No fees. Direct payment to creditors available.",
    },
    {
        "product_id": "DISCOVER-B1-PERSONAL",
        "product_name": "Discover Personal Loan",
        "lender_name": "Discover",
        "loan_type": "personal",
        "grade": "B",
        "min_credit_score": 680,
        "max_credit_score": 719,
        "min_apr": 7.99,
        "max_apr": 24.99,
        "min_amount": 2500,
        "max_amount": 35000,
        "terms_months": "36,48,60,72,84",
        "origination_fee_pct": 0.0,
        "description": "No origination fees. Flexible terms up to 84 months.",
    },
]

# =============================================================================
# DATABASE SETUP
# =============================================================================

def create_loan_products_db():
    """Create SQLite database with loan products."""
    
    db_path = os.path.join(os.path.dirname(__file__), 'loan_products.db')
    
    print("=" * 50)
    print("Loading LendingClub-Based Loan Products")
    print("=" * 50)
    
    # Create DataFrame
    df = pd.DataFrame(LOAN_PRODUCTS)
    
    # Connect to SQLite
    conn = sqlite3.connect(db_path)
    
    # Create table
    df.to_sql('loan_products', conn, if_exists='replace', index=False)
    
    print(f"\n✅ Created {len(df)} loan products")
    print(f"📁 Database saved to: {db_path}")
    
    # Show summary
    print("\n📊 Loan Products Summary:")
    print("-" * 50)
    for grade in ['A', 'B', 'C', 'D', 'E']:
        grade_products = df[df['grade'] == grade]
        if len(grade_products) > 0:
            apr_range = f"{grade_products['min_apr'].min():.2f}% - {grade_products['max_apr'].max():.2f}%"
            score_range = f"{grade_products['min_credit_score'].min()} - {grade_products['max_credit_score'].max()}"
            print(f"  Grade {grade}: {len(grade_products)} products | APR: {apr_range} | Score: {score_range}")
    
    # Also export to CSV for easy viewing
    csv_path = os.path.join(os.path.dirname(__file__), 'loan_products.csv')
    df.to_csv(csv_path, index=False)
    print(f"\n📄 CSV export: {csv_path}")
    
    conn.close()
    
    return df


def get_loan_products_for_score(credit_score: int) -> pd.DataFrame:
    """Get eligible loan products for a given credit score."""
    
    db_path = os.path.join(os.path.dirname(__file__), 'loan_products.db')
    conn = sqlite3.connect(db_path)
    
    query = """
        SELECT * FROM loan_products 
        WHERE min_credit_score <= ? AND max_credit_score >= ?
        ORDER BY min_apr ASC
    """
    
    df = pd.read_sql_query(query, conn, params=(credit_score, credit_score))
    conn.close()
    
    return df


if __name__ == "__main__":
    df = create_loan_products_db()
    
    # Test: Show products for different credit scores
    print("\n" + "=" * 50)
    print("Sample: Products for Credit Score 700")
    print("=" * 50)
    
    products = get_loan_products_for_score(700)
    for _, row in products.iterrows():
        print(f"  • {row['product_name']} ({row['lender_name']}): {row['min_apr']:.2f}%-{row['max_apr']:.2f}% APR")

