"""
Users Router
============
Endpoints for user profile management and credit scoring.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas.user import (
    UserProfile,
    FinancialProfile,
    LoanPreferences,
    CreditScoreResponse
)

router = APIRouter(prefix="/users", tags=["Users"])


# =============================================================================
# PROFILE MANAGEMENT
# =============================================================================

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current user's full profile.
    
    Includes personal information, financial profile, and credit score.
    """
    return UserProfile.model_validate(current_user)


@router.put("/profile/financial", response_model=UserProfile)
async def update_financial_profile(
    profile: FinancialProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the user's financial profile.
    
    This information is used to calculate the credit score.
    """
    # Update only provided fields
    update_data = profile.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserProfile.model_validate(current_user)


@router.put("/profile/loan-preferences", response_model=UserProfile)
async def update_loan_preferences(
    preferences: LoanPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the user's loan preferences.
    """
    update_data = preferences.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserProfile.model_validate(current_user)


# =============================================================================
# CREDIT SCORE CALCULATION
# =============================================================================

def calculate_credit_score(user: User) -> tuple[int, float]:
    """
    Calculate credit score based on user's financial profile.
    
    This is a simplified scoring model. In production, you would
    load the trained ML model (TFT, SAINT, etc.) and make predictions.
    
    Returns:
        tuple: (credit_score: 300-850, default_probability: 0-1)
    """
    score = 600  # Base score
    
    # Income factor (max +80 points)
    if user.annual_income:
        if user.annual_income >= 100000:
            score += 80
        elif user.annual_income >= 75000:
            score += 60
        elif user.annual_income >= 50000:
            score += 40
        elif user.annual_income >= 30000:
            score += 20
    
    # Payment history factor (max +100 points)
    if user.payment_frequency:
        payment_scores = {
            'always': 100,
            'usually': 60,
            'sometimes': 20,
            'rarely': -20
        }
        score += payment_scores.get(user.payment_frequency, 0)
    
    # Credit utilization factor (max +60 points)
    if user.credit_utilization is not None:
        if user.credit_utilization < 10:
            score += 60
        elif user.credit_utilization < 30:
            score += 50
        elif user.credit_utilization < 50:
            score += 30
        elif user.credit_utilization < 70:
            score += 10
        else:
            score -= 20  # High utilization is bad
    
    # Payment delay penalty (max -80 points)
    if user.longest_delay:
        delay_penalties = {
            'none': 40,
            '1-month': -20,
            '2-months': -60
        }
        score += delay_penalties.get(user.longest_delay, 0)
    
    # Account diversity bonus (max +20 points)
    if user.credit_accounts:
        if 3 <= user.credit_accounts <= 5:
            score += 20
        elif user.credit_accounts >= 2:
            score += 10
    
    # Clamp score to valid range
    score = max(300, min(850, score))
    
    # Calculate default probability (inverse relationship with score)
    # Score 850 → ~5% default, Score 300 → ~80% default
    default_prob = max(0.05, min(0.80, 1.0 - (score - 300) / 700))
    
    return score, round(default_prob, 4)


def get_score_label(score: int) -> str:
    """Get the label for a credit score."""
    if score < 580:
        return "Poor"
    elif score < 670:
        return "Fair"
    elif score < 740:
        return "Good"
    elif score < 800:
        return "Very Good"
    return "Excellent"


def get_risk_level(default_prob: float) -> str:
    """Get the risk level based on default probability."""
    if default_prob < 0.15:
        return "Low"
    elif default_prob < 0.35:
        return "Medium"
    return "High"


@router.post("/calculate-score", response_model=CreditScoreResponse)
async def calculate_user_credit_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate and update the user's credit score.
    
    Uses the user's financial profile to compute:
    - Credit score (300-850)
    - Default probability (0-1)
    - Risk level (Low, Medium, High)
    
    The score is saved to the user's profile.
    """
    # Check if user has enough profile data
    if not current_user.payment_frequency:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your financial profile first"
        )
    
    # Calculate score
    score, default_prob = calculate_credit_score(current_user)
    
    # Update user record
    current_user.credit_score = score
    current_user.default_probability = default_prob
    current_user.last_score_update = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return CreditScoreResponse(
        credit_score=score,
        score_label=get_score_label(score),
        default_probability=default_prob,
        risk_level=get_risk_level(default_prob)
    )


@router.get("/credit-score", response_model=CreditScoreResponse)
async def get_credit_score(current_user: User = Depends(get_current_user)):
    """
    Get the user's current credit score.
    
    Returns the last calculated score without recalculating.
    """
    if current_user.credit_score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit score not yet calculated. Please calculate first."
        )
    
    return CreditScoreResponse(
        credit_score=current_user.credit_score,
        score_label=get_score_label(current_user.credit_score),
        default_probability=current_user.default_probability or 0.5,
        risk_level=get_risk_level(current_user.default_probability or 0.5)
    )

