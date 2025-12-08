"""
User Database Model
===================
SQLAlchemy model for the users table.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    """
    User model representing customers in the CreditWise platform.
    
    This table stores:
    - Authentication credentials (email, password hash)
    - Personal information (name, date of birth)
    - Financial profile for credit scoring
    - Credit score computed by ML model
    
    Table: users
    """
    
    __tablename__ = "users"
    
    # ==========================================================================
    # Primary Key
    # ==========================================================================
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # ==========================================================================
    # Authentication Fields
    # ==========================================================================
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # ==========================================================================
    # Personal Information
    # ==========================================================================
    full_name = Column(String(255), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    employment_status = Column(String(50), nullable=True)  # employed, self-employed, student, retired
    
    # ==========================================================================
    # Financial Profile (for ML model input)
    # ==========================================================================
    annual_income = Column(Float, nullable=True)
    monthly_expenses = Column(Float, nullable=True)
    credit_limit = Column(Float, nullable=True)
    credit_accounts = Column(Integer, nullable=True)
    payment_frequency = Column(String(20), nullable=True)  # always, usually, sometimes, rarely
    longest_delay = Column(String(20), nullable=True)  # none, 1-month, 2-months
    credit_utilization = Column(Float, nullable=True)  # 0-100 percentage
    
    # ==========================================================================
    # Credit Score (computed by ML model)
    # ==========================================================================
    credit_score = Column(Integer, nullable=True)  # 300-850
    default_probability = Column(Float, nullable=True)  # 0.0-1.0
    last_score_update = Column(DateTime, nullable=True)
    
    # ==========================================================================
    # Loan Preferences
    # ==========================================================================
    desired_loan_amount = Column(Float, nullable=True)
    loan_purpose = Column(String(50), nullable=True)  # home, car, education, personal, business
    repayment_period = Column(Integer, nullable=True)  # months
    
    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.full_name}')>"

