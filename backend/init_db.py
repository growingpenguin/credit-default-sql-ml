#!/usr/bin/env python
"""
Database Initialization Script
==============================
Creates the PostgreSQL database and tables.

Prerequisites:
1. PostgreSQL installed and running
2. Create a database named 'creditwise':
   
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE creditwise;
   
   # Create user (optional)
   CREATE USER creditwise_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE creditwise TO creditwise_user;

Usage:
    python init_db.py
"""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine
from app.models.user import User


def init_database():
    """Create all database tables."""
    print("=" * 50)
    print("CreditWise Database Initialization")
    print("=" * 50)
    
    print("\n📦 Creating database tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        
        # List created tables
        print("\n📋 Created tables:")
        for table in Base.metadata.tables:
            print(f"   - {table}")
        
        print("\n🎉 Database initialization complete!")
        print("\nNext steps:")
        print("1. Start the API server: uvicorn app.main:app --reload")
        print("2. Open API docs: http://localhost:8000/docs")
        print("3. Register a user via POST /api/auth/register")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check your DATABASE_URL in .env")
        print("3. Make sure the database 'creditwise' exists")
        sys.exit(1)


if __name__ == "__main__":
    init_database()

