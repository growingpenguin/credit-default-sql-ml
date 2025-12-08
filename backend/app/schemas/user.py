"""
User Pydantic Schemas
=====================
Request/Response schemas for user-related endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# =============================================================================
# BASE SCHEMAS
# =============================================================================

class UserBase(BaseModel):
    """Base user fields shared across schemas."""
    email: EmailStr
    full_name: Optional[str] = None


# =============================================================================
# AUTHENTICATION SCHEMAS
# =============================================================================

class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "full_name": "John Doe",
                "password": "securepassword123"
            }
        }


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }


class TokenData(BaseModel):
    """Data extracted from JWT token."""
    user_id: Optional[int] = None


# =============================================================================
# FINANCIAL PROFILE SCHEMAS
# =============================================================================

class FinancialProfile(BaseModel):
    """Schema for updating user's financial profile."""
    annual_income: Optional[float] = Field(None, ge=0, description="Annual income in dollars")
    monthly_expenses: Optional[float] = Field(None, ge=0, description="Monthly expenses in dollars")
    credit_limit: Optional[float] = Field(None, ge=0, description="Current credit limit")
    credit_accounts: Optional[int] = Field(None, ge=0, le=20, description="Number of credit accounts")
    payment_frequency: Optional[str] = Field(None, pattern="^(always|usually|sometimes|rarely)$")
    longest_delay: Optional[str] = Field(None, pattern="^(none|1-month|2-months)$")
    credit_utilization: Optional[float] = Field(None, ge=0, le=100, description="Credit utilization percentage")
    
    class Config:
        json_schema_extra = {
            "example": {
                "annual_income": 75000,
                "monthly_expenses": 3000,
                "credit_limit": 15000,
                "credit_accounts": 3,
                "payment_frequency": "always",
                "longest_delay": "none",
                "credit_utilization": 25.5
            }
        }


class LoanPreferences(BaseModel):
    """Schema for loan preferences."""
    desired_loan_amount: Optional[float] = Field(None, ge=1000, le=100000)
    loan_purpose: Optional[str] = Field(None, pattern="^(home|car|education|personal|business)$")
    repayment_period: Optional[int] = Field(None, ge=12, le=60, description="Repayment period in months")
    
    class Config:
        json_schema_extra = {
            "example": {
                "desired_loan_amount": 25000,
                "loan_purpose": "personal",
                "repayment_period": 36
            }
        }


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class UserResponse(UserBase):
    """Schema for user response (excludes password)."""
    id: int
    is_active: bool
    is_verified: bool
    credit_score: Optional[int] = None
    default_probability: Optional[float] = None
    created_at: Optional[datetime] = None
    
    # Financial profile
    annual_income: Optional[float] = None
    credit_limit: Optional[float] = None
    credit_utilization: Optional[float] = None
    
    class Config:
        from_attributes = True  # Enable ORM mode


class UserProfile(UserResponse):
    """Full user profile including all fields."""
    date_of_birth: Optional[datetime] = None
    employment_status: Optional[str] = None
    monthly_expenses: Optional[float] = None
    credit_accounts: Optional[int] = None
    payment_frequency: Optional[str] = None
    longest_delay: Optional[str] = None
    desired_loan_amount: Optional[float] = None
    loan_purpose: Optional[str] = None
    repayment_period: Optional[int] = None
    last_score_update: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CreditScoreResponse(BaseModel):
    """Response for credit score calculation."""
    credit_score: int = Field(..., ge=300, le=850)
    score_label: str  # Poor, Fair, Good, Very Good, Excellent
    default_probability: float = Field(..., ge=0, le=1)
    risk_level: str  # Low, Medium, High
    
    class Config:
        json_schema_extra = {
            "example": {
                "credit_score": 724,
                "score_label": "Good",
                "default_probability": 0.15,
                "risk_level": "Low"
            }
        }


# Update forward references
Token.model_rebuild()

