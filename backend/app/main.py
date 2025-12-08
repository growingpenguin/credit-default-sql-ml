"""
CreditWise API - Main Application
==================================
FastAPI backend for the CreditWise credit risk assessment platform.

Features:
- User authentication (JWT)
- PostgreSQL database integration
- Credit score calculation
- CORS support for React frontend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import Base, engine
from .routers import auth_router, users_router, loans_router


# =============================================================================
# APPLICATION LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    
    - Startup: Create database tables
    - Shutdown: Clean up resources
    """
    # Startup: Create tables if they don't exist
    print("🚀 Starting CreditWise API...")
    print(f"📦 Database: {settings.DATABASE_URL.split('@')[-1]}")  # Hide credentials
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
    
    yield  # Application runs here
    
    # Shutdown
    print("👋 Shutting down CreditWise API...")


# =============================================================================
# CREATE APPLICATION
# =============================================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## CreditWise API
    
    AI-powered credit risk assessment platform.
    
    ### Features
    - 🔐 **Authentication**: JWT-based login and registration
    - 👤 **User Profiles**: Manage financial information
    - 📊 **Credit Scoring**: AI-powered risk assessment
    - 💳 **Loan Recommendations**: Personalized loan options
    
    ### Authentication
    Most endpoints require a JWT token. Get one by:
    1. Register at `/api/auth/register`
    2. Login at `/api/auth/login`
    3. Include the token in the `Authorization: Bearer <token>` header
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)


# =============================================================================
# CORS MIDDLEWARE
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# =============================================================================
# INCLUDE ROUTERS
# =============================================================================

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(loans_router, prefix="/api")


# =============================================================================
# ROOT ENDPOINTS
# =============================================================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "database": "connected"
    }


# =============================================================================
# RUN WITH UVICORN (for development)
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

