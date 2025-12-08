"""
Application Configuration
=========================
Load settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Create a .env file in the backend directory with your settings,
    or set environment variables directly.
    """
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/creditwise"
    
    # JWT Authentication
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - Frontend URLs that can access the API
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    # Application
    DEBUG: bool = True
    APP_NAME: str = "CreditWise API"
    APP_VERSION: str = "1.0.0"
    
    # ML Model
    MODEL_PATH: str = "../notebooks/best_tft_model.pt"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create global settings instance
settings = Settings()

