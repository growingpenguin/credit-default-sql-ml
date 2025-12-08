#!/usr/bin/env python
"""
Seed Loan Products into PostgreSQL
==================================
Populates the loan_products table with real LendingClub-based data.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.models.loan_product import LoanProduct

# =============================================================================
# LENDINGCLUB-BASED LOAN PRODUCTS (Real Interest Rate Data)
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


def seed_loan_products():
    """Seed loan products into PostgreSQL."""
    
    print("=" * 50)
    print("Seeding Loan Products into PostgreSQL")
    print("=" * 50)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Clear existing products
        db.query(LoanProduct).delete()
        db.commit()
        print("🗑️  Cleared existing loan products")
        
        # Insert new products
        for product_data in LOAN_PRODUCTS:
            product = LoanProduct(**product_data)
            db.add(product)
        
        db.commit()
        print(f"✅ Inserted {len(LOAN_PRODUCTS)} loan products")
        
        # Show summary
        print("\n📊 Loan Products by Grade:")
        print("-" * 50)
        
        for grade in ['A', 'B', 'C', 'D', 'E']:
            count = db.query(LoanProduct).filter(LoanProduct.grade == grade).count()
            if count > 0:
                products = db.query(LoanProduct).filter(LoanProduct.grade == grade).all()
                apr_min = min(p.min_apr for p in products)
                apr_max = max(p.max_apr for p in products)
                print(f"  Grade {grade}: {count} products | APR: {apr_min:.2f}% - {apr_max:.2f}%")
        
        print("\n📊 Loan Products by Lender:")
        print("-" * 50)
        
        lenders = db.query(LoanProduct.lender_name).distinct().all()
        for (lender,) in lenders:
            count = db.query(LoanProduct).filter(LoanProduct.lender_name == lender).count()
            print(f"  {lender}: {count} products")
        
        print("\n🎉 Seeding complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_loan_products()

