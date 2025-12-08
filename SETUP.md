# CreditWise Platform Setup Guide

This guide will help you set up the CreditWise platform with PostgreSQL database, FastAPI backend, and React frontend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CreditWise Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐      ┌─────────────────┐                  │
│   │     React       │      │    FastAPI      │                  │
│   │    Frontend     │◄────►│    Backend      │                  │
│   │  (Port 5173)    │ REST │  (Port 8000)    │                  │
│   └─────────────────┘  API └────────┬────────┘                  │
│                                     │                            │
│                                     │ SQLAlchemy                │
│                                     ▼                            │
│                           ┌─────────────────┐                   │
│                           │   PostgreSQL    │                   │
│                           │   (Port 5432)   │                   │
│                           └─────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**

## Step 1: Install PostgreSQL

### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Set Up the Database

### Option A: Automatic Setup (Recommended)
```bash
cd backend
chmod +x setup_postgres.sh
./setup_postgres.sh
```

### Option B: Manual Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE creditwise;
CREATE USER creditwise_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE creditwise TO creditwise_user;
\q
```

Then create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://creditwise_user:your_password@localhost:5432/creditwise
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Step 3: Set Up the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database tables
python init_db.py

# Start the server
python run.py
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Step 4: Set Up the Frontend

```bash
cd "Design CreditWise Platform"

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:5173

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/logout` | Logout (client-side token deletion) |
| GET | `/api/auth/me` | Get current user info |

### User Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get full user profile |
| PUT | `/api/users/profile/financial` | Update financial profile |
| PUT | `/api/users/profile/loan-preferences` | Update loan preferences |
| POST | `/api/users/calculate-score` | Calculate credit score |
| GET | `/api/users/credit-score` | Get current credit score |

## Example API Usage

### Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123",
    "full_name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Update Financial Profile
```bash
curl -X PUT http://localhost:8000/api/users/profile/financial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "annual_income": 75000,
    "credit_utilization": 25,
    "payment_frequency": "always"
  }'
```

## Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    full_name VARCHAR(255),
    date_of_birth TIMESTAMP,
    employment_status VARCHAR(50),
    annual_income FLOAT,
    monthly_expenses FLOAT,
    credit_limit FLOAT,
    credit_accounts INTEGER,
    payment_frequency VARCHAR(20),
    longest_delay VARCHAR(20),
    credit_utilization FLOAT,
    credit_score INTEGER,
    default_probability FLOAT,
    last_score_update TIMESTAMP,
    desired_loan_amount FLOAT,
    loan_purpose VARCHAR(50),
    repayment_period INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check PostgreSQL service status (macOS)
brew services list

# Restart PostgreSQL (macOS)
brew services restart postgresql@15
```

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### CORS Issues
Make sure your frontend URL is in the `ALLOWED_ORIGINS` environment variable.

## Production Deployment

For production, remember to:
1. Use a strong `SECRET_KEY`
2. Set `DEBUG=False`
3. Use HTTPS
4. Configure proper CORS origins
5. Use a production WSGI server like Gunicorn
6. Set up proper database backups

```bash
# Production run example
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

