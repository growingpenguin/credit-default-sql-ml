"""
Loan Product Database Model
===========================
SQLAlchemy model for loan products based on LendingClub data.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean
from ..core.database import Base


class LoanProduct(Base):
    """
    Loan products available to users based on their credit profile.
    
    Data sourced from LendingClub, SoFi, Prosper, Upstart, Marcus, and Discover
    public rate sheets and SEC filings.
    
    Table: loan_products
    """
    
    __tablename__ = "loan_products"
    
    # ==========================================================================
    # Primary Key
    # ==========================================================================
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # ==========================================================================
    # Product Information
    # ==========================================================================
    product_name = Column(String(100), nullable=False)
    lender_name = Column(String(100), nullable=False)
    loan_type = Column(String(50), nullable=False)  # personal, debt_consolidation, home, car, education, business
    grade = Column(String(5), nullable=False)  # A, B, C, D, E, F, G
    description = Column(String(500), nullable=True)
    
    # ==========================================================================
    # Credit Requirements
    # ==========================================================================
    min_credit_score = Column(Integer, nullable=False)
    max_credit_score = Column(Integer, nullable=False)
    
    # ==========================================================================
    # Loan Terms
    # ==========================================================================
    min_apr = Column(Float, nullable=False)  # Minimum APR %
    max_apr = Column(Float, nullable=False)  # Maximum APR %
    min_amount = Column(Float, nullable=False)  # Minimum loan amount
    max_amount = Column(Float, nullable=False)  # Maximum loan amount
    terms_months = Column(String(50), nullable=False)  # Comma-separated: "36,48,60"
    origination_fee_pct = Column(Float, default=0.0)  # Origination fee %
    
    # ==========================================================================
    # Status
    # ==========================================================================
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<LoanProduct(id={self.product_id}, name='{self.product_name}', apr={self.min_apr}-{self.max_apr}%)>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "lender_name": self.lender_name,
            "loan_type": self.loan_type,
            "grade": self.grade,
            "description": self.description,
            "min_credit_score": self.min_credit_score,
            "max_credit_score": self.max_credit_score,
            "min_apr": self.min_apr,
            "max_apr": self.max_apr,
            "min_amount": self.min_amount,
            "max_amount": self.max_amount,
            "terms_months": self.terms_months,
            "origination_fee_pct": self.origination_fee_pct,
            "is_active": self.is_active,
        }

