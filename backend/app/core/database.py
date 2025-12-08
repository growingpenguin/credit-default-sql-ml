"""
Database Configuration
======================
SQLAlchemy setup for PostgreSQL connection.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# =============================================================================
# DATABASE ENGINE
# =============================================================================

# Create SQLAlchemy engine
# - pool_pre_ping: Check connection health before using
# - pool_size: Number of connections to keep in the pool
# - max_overflow: Additional connections allowed beyond pool_size
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# =============================================================================
# SESSION FACTORY
# =============================================================================

# SessionLocal is a factory that creates new database sessions
# - autocommit=False: We control when to commit
# - autoflush=False: We control when to flush to DB
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# =============================================================================
# BASE CLASS FOR MODELS
# =============================================================================

# All database models will inherit from this Base class
Base = declarative_base()


# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================

def get_db():
    """
    Database session dependency for FastAPI endpoints.
    
    Usage in routes:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    
    The session is automatically closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

