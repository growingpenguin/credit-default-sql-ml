"""
Loans Router
============
Endpoints for loan products and personalized recommendations.

Data sourced from LendingClub, SoFi, Prosper, Upstart, Marcus, and Discover.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.loan_product import LoanProduct

router = APIRouter(prefix="/loans", tags=["Loans"])


# =============================================================================
# SCHEMAS
# =============================================================================

class LoanProductResponse(BaseModel):
    """Loan product response schema."""
    id: int
    product_id: str
    product_name: str
    lender_name: str
    loan_type: str
    grade: str
    description: Optional[str]
    min_credit_score: int
    max_credit_score: int
    min_apr: float
    max_apr: float
    min_amount: float
    max_amount: float
    terms_months: str
    origination_fee_pct: float
    
    class Config:
        from_attributes = True


class PersonalizedLoanResponse(BaseModel):
    """Personalized loan recommendation."""
    product: LoanProductResponse
    estimated_apr: float  # Calculated based on user's credit score
    approval_probability: int  # Percentage based on ML model
    monthly_payment: Optional[float]  # If loan amount provided
    is_pre_qualified: bool
    is_best_match: bool


class LoanRecommendationsResponse(BaseModel):
    """Response with multiple loan recommendations."""
    credit_score: int
    total_products: int
    recommendations: List[PersonalizedLoanResponse]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def calculate_estimated_apr(product: LoanProduct, credit_score: int) -> float:
    """
    Calculate estimated APR based on credit score within product's range.
    
    Higher credit score = lower APR (closer to min_apr)
    Lower credit score = higher APR (closer to max_apr)
    """
    score_range = product.max_credit_score - product.min_credit_score
    if score_range == 0:
        return (product.min_apr + product.max_apr) / 2
    
    apr_range = product.max_apr - product.min_apr
    
    # Calculate position in score range (0 = lowest, 1 = highest)
    score_position = (credit_score - product.min_credit_score) / score_range
    score_position = max(0, min(1, score_position))  # Clamp to 0-1
    
    # Higher score = lower APR
    estimated_apr = product.max_apr - (score_position * apr_range)
    
    return round(estimated_apr, 2)


def calculate_approval_probability(credit_score: int, product: LoanProduct, default_prob: float = None) -> int:
    """
    Calculate approval probability based on credit score and product requirements.
    
    Uses ML model's default probability if available.
    """
    if default_prob is not None:
        # Convert default probability to approval probability
        # Lower default prob = higher approval
        base_approval = int((1 - default_prob) * 100)
    else:
        # Estimate based on credit score position in product range
        score_mid = (product.min_credit_score + product.max_credit_score) / 2
        if credit_score >= product.max_credit_score:
            base_approval = 95
        elif credit_score >= score_mid:
            base_approval = 85
        elif credit_score >= product.min_credit_score:
            base_approval = 70
        else:
            base_approval = 50
    
    # Grade adjustments
    grade_bonus = {'A': 5, 'B': 3, 'C': 0, 'D': -5, 'E': -10}.get(product.grade, 0)
    
    approval = base_approval + grade_bonus
    return max(10, min(99, approval))  # Clamp between 10-99%


def calculate_monthly_payment(principal: float, apr: float, term_months: int) -> float:
    """
    Calculate monthly payment using amortization formula.
    
    M = P * [r(1+r)^n] / [(1+r)^n - 1]
    """
    if apr == 0:
        return principal / term_months
    
    monthly_rate = apr / 100 / 12
    payment = principal * (monthly_rate * (1 + monthly_rate) ** term_months) / ((1 + monthly_rate) ** term_months - 1)
    return round(payment, 2)


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/products", response_model=List[LoanProductResponse])
async def get_all_loan_products(
    loan_type: Optional[str] = Query(None, description="Filter by loan type"),
    db: Session = Depends(get_db)
):
    """
    Get all available loan products.
    
    Optional filters:
    - loan_type: personal, debt_consolidation, home, car, education, business
    """
    query = db.query(LoanProduct).filter(LoanProduct.is_active == True)
    
    if loan_type:
        query = query.filter(LoanProduct.loan_type == loan_type)
    
    products = query.order_by(LoanProduct.min_apr).all()
    return products


@router.get("/products/{product_id}", response_model=LoanProductResponse)
async def get_loan_product(product_id: str, db: Session = Depends(get_db)):
    """Get a specific loan product by ID."""
    product = db.query(LoanProduct).filter(LoanProduct.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Loan product not found")
    return product


@router.get("/recommendations", response_model=LoanRecommendationsResponse)
async def get_personalized_recommendations(
    current_user: User = Depends(get_current_user),
    loan_type: Optional[str] = Query(None, description="Filter by loan type"),
    loan_amount: Optional[float] = Query(None, ge=1000, le=100000, description="Desired loan amount"),
    term_months: Optional[int] = Query(36, description="Loan term in months"),
    db: Session = Depends(get_db)
):
    """
    Get personalized loan recommendations based on user's credit profile.
    
    Returns loans the user qualifies for, sorted by estimated APR.
    Includes approval probability based on ML model predictions.
    """
    credit_score = current_user.credit_score
    if not credit_score:
        raise HTTPException(
            status_code=400, 
            detail="Please calculate your credit score first to see personalized recommendations"
        )
    
    # Query eligible products
    query = db.query(LoanProduct).filter(
        LoanProduct.is_active == True,
        LoanProduct.min_credit_score <= credit_score,
        LoanProduct.max_credit_score >= credit_score
    )
    
    if loan_type:
        query = query.filter(LoanProduct.loan_type == loan_type)
    
    products = query.order_by(LoanProduct.min_apr).all()
    
    if not products:
        raise HTTPException(
            status_code=404,
            detail="No loan products available for your credit profile"
        )
    
    # Build personalized recommendations
    recommendations = []
    best_match_found = False
    
    for product in products:
        estimated_apr = calculate_estimated_apr(product, credit_score)
        approval_prob = calculate_approval_probability(
            credit_score, 
            product, 
            current_user.default_probability
        )
        
        # Calculate monthly payment if amount provided
        monthly_payment = None
        if loan_amount:
            monthly_payment = calculate_monthly_payment(loan_amount, estimated_apr, term_months)
        
        # Determine if pre-qualified (high approval probability)
        is_pre_qualified = approval_prob >= 80
        
        # First product with high approval is best match
        is_best_match = not best_match_found and approval_prob >= 85
        if is_best_match:
            best_match_found = True
        
        recommendations.append(PersonalizedLoanResponse(
            product=LoanProductResponse.model_validate(product),
            estimated_apr=estimated_apr,
            approval_probability=approval_prob,
            monthly_payment=monthly_payment,
            is_pre_qualified=is_pre_qualified,
            is_best_match=is_best_match
        ))
    
    return LoanRecommendationsResponse(
        credit_score=credit_score,
        total_products=len(recommendations),
        recommendations=recommendations
    )


@router.get("/calculate-payment")
async def calculate_loan_payment(
    amount: float = Query(..., ge=1000, le=100000, description="Loan amount"),
    apr: float = Query(..., ge=0, le=40, description="Annual Percentage Rate"),
    term_months: int = Query(36, ge=12, le=84, description="Loan term in months")
):
    """
    Calculate monthly payment for a loan.
    
    Uses standard amortization formula.
    """
    monthly_payment = calculate_monthly_payment(amount, apr, term_months)
    total_payment = monthly_payment * term_months
    total_interest = total_payment - amount
    
    return {
        "loan_amount": amount,
        "apr": apr,
        "term_months": term_months,
        "monthly_payment": monthly_payment,
        "total_payment": round(total_payment, 2),
        "total_interest": round(total_interest, 2)
    }

