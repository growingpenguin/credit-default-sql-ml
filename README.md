# 💳 CreditWise - AI-Powered Mini Bank Platform

[![ML Pipeline](https://github.com/growingpenguin/credit-default-sql-ml/actions/workflows/ml-pipeline.yml/badge.svg)](https://github.com/growingpenguin/credit-default-sql-ml/actions/workflows/ml-pipeline.yml)

A **full-stack mini bank application** where customers can check loan eligibility and explore personalized loan options. Built with enterprise-grade technologies including **Java Spring Boot**, **Nginx**, **React**, and **state-of-the-art deep learning models** for credit risk assessment.

---

## 🌟 Project Highlights

| Component | Technology | Description |
|-----------|------------|-------------|
| **Reverse Proxy** | Nginx | Production-ready load balancing & SSL |
| **Backend API** | Java Spring Boot 3.2 | Enterprise REST API with JWT auth |
| **ML Service** | Python FastAPI | Deep learning model inference |
| **Frontend** | React + TypeScript + Tailwind | Modern responsive UI |
| **Database** | PostgreSQL | Robust relational data storage |
| **ML Models** | PyTorch (TFT, LSTM, SAINT) | State-of-the-art credit risk prediction |
| **Loan Data** | LendingClub | Real APR rates from 6 lenders |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CREDITWISE MINI BANK PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              ┌─────────────────┐                                │
│                              │     Nginx       │                                │
│                              │   (Port 80)     │                                │
│                              │  Reverse Proxy  │                                │
│                              └────────┬────────┘                                │
│                                       │                                         │
│               ┌───────────────────────┼───────────────────────┐                 │
│               │                       │                       │                 │
│               ▼                       ▼                       ▼                 │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐          │
│   │     React       │     │  Spring Boot    │     │    FastAPI      │          │
│   │   Frontend      │     │   (Port 8080)   │     │  ML Service     │          │
│   │  (Port 3001)    │     │                 │     │  (Port 8000)    │          │
│   │                 │     │  • JWT Auth     │     │                 │          │
│   │  • Login UI     │     │  • User CRUD    │     │  • TFT Model    │          │
│   │  • Dashboard    │     │  • Loan API     │     │  • LSTM Model   │          │
│   │  • Form Wizard  │     │  • Credit Score │     │  • SAINT Model  │          │
│   │  • Loan Cards   │     │  • Swagger UI   │     │  • Predictions  │          │
│   │                 │     │                 │     │                 │          │
│   └─────────────────┘     └────────┬────────┘     └─────────────────┘          │
│                                    │                                            │
│                                    ▼                                            │
│                          ┌─────────────────┐                                   │
│                          │   PostgreSQL    │                                   │
│                          │   (Port 5432)   │                                   │
│                          │                 │                                   │
│                          │  • users        │                                   │
│                          │  • loan_products│                                   │
│                          │  (13 products)  │                                   │
│                          └─────────────────┘                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Client Request → Nginx (/:80)
                    │
                    ├── /            → React Frontend (static files)
                    ├── /api/*       → Spring Boot (Java backend)
                    └── /ml/*        → FastAPI (Python ML service)
```

---

## 🖥️ Technology Stack

### Backend (Spring Boot)
| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17 LTS | Language runtime |
| Spring Boot | 3.2.0 | Application framework |
| Spring Security | 6.x | JWT authentication |
| Spring Data JPA | 3.x | Database ORM |
| Lombok | 1.18 | Reduce boilerplate |
| PostgreSQL Driver | 42.x | Database connectivity |
| JJWT | 0.12.3 | JWT token handling |
| SpringDoc OpenAPI | 2.3 | Swagger UI documentation |

### Frontend (React)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| Radix UI | 1.x | Accessible components |
| Recharts | 2.x | Data visualization |

### ML Service (FastAPI)
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Language runtime |
| FastAPI | 0.109 | REST API framework |
| PyTorch | 2.x | Deep learning |
| scikit-learn | 1.3+ | ML utilities |

---

## 📁 Project Structure

```
credit-default-sql-ml/
│
├── 📁 spring-backend/                    # ☕ Java Spring Boot Backend
│   ├── src/main/java/com/creditwise/
│   │   ├── CreditWiseApplication.java    # Main application
│   │   ├── config/
│   │   │   ├── SecurityConfig.java       # Spring Security + JWT
│   │   │   ├── DataLoader.java           # Auto-seeds loan products
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── controller/
│   │   │   ├── AuthController.java       # POST /auth/login, /register
│   │   │   ├── UserController.java       # GET/PUT /users/profile
│   │   │   ├── LoanController.java       # GET /loans/products
│   │   │   └── HealthController.java     # GET /health
│   │   ├── dto/                          # Request/Response DTOs
│   │   ├── entity/
│   │   │   ├── User.java                 # JPA Entity
│   │   │   └── LoanProduct.java          # JPA Entity
│   │   ├── repository/                   # Spring Data JPA
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java     # JWT generation/validation
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── CustomUserDetailsService.java
│   │   └── service/                      # Business logic
│   ├── src/main/resources/
│   │   └── application.yml               # Configuration
│   ├── pom.xml                           # Maven dependencies
│   └── README.md                         # Spring Boot docs
│
├── 📁 backend/                           # 🐍 Python FastAPI (ML Service)
│   ├── app/
│   │   ├── main.py                       # FastAPI application
│   │   ├── core/                         # Config, DB, Security
│   │   ├── models/                       # SQLAlchemy models
│   │   ├── routers/                      # API endpoints
│   │   └── services/                     # Business logic
│   └── requirements.txt
│
├── 📁 nginx/                             # 🔧 Nginx Configuration
│   └── nginx.conf                        # Reverse proxy config
│
├── 📁 Design CreditWise Platform/        # ⚛️ React Frontend
│   ├── src/
│   │   ├── components/                   # UI components
│   │   │   ├── pages/                    # Page components
│   │   │   ├── charts/                   # Credit score gauge
│   │   │   ├── layout/                   # Header, Footer
│   │   │   └── ui/                       # Reusable UI
│   │   ├── services/
│   │   │   └── api.ts                    # API client
│   │   └── App.tsx                       # Main application
│   ├── package.json
│   └── vite.config.ts
│
├── 📁 data/                              # 📊 Data Files
│   ├── load_data.py                      # UCI dataset loader
│   ├── load_lending_club.py              # Loan products loader
│   ├── loan_products.csv                 # 13 loan products
│   └── credit_default_raw.csv
│
├── 📁 sql/                               # 🗄️ SQL Scripts
│   ├── schema.sql                        # Database schema
│   ├── populate_tables.py                # Data population
│   └── feature_engineering.sql           # Feature queries
│
├── 📁 notebooks/                         # 🤖 ML Training Scripts
│   ├── train_tft_credit_default.py       # TFT (Best: AUC 0.7745)
│   ├── train_lstm_credit_default.py      # LSTM
│   ├── train_saint_credit_default.py     # SAINT (fully annotated!)
│   └── train_ft_transformer_credit_default.py
│
├── 📁 docker/                            # 🐳 Docker Configuration
│   ├── Dockerfile.spring                 # Spring Boot image
│   ├── Dockerfile.fastapi                # FastAPI image
│   ├── Dockerfile.frontend               # React image
│   └── docker-compose.yml                # Full stack orchestration
│
├── requirements.txt                      # Python dependencies
├── SETUP.md                              # Setup guide
└── README.md                             # This file
```

---

## 🔗 API Endpoints

### Spring Boot Backend (Port 8080)

#### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login, get JWT token | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/auth/logout` | Logout | ✅ |

#### User Profile
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Get full profile | ✅ |
| PUT | `/api/users/profile/financial` | Update financial info | ✅ |
| POST | `/api/users/calculate-score` | Calculate credit score | ✅ |
| GET | `/api/users/credit-score` | Get current score | ✅ |

#### Loan Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/loans/products` | All 13 loan products | ❌ |
| GET | `/api/loans/products/{id}` | Single product | ❌ |
| GET | `/api/loans/recommendations` | Personalized recommendations | ✅ |
| GET | `/api/loans/calculate-payment` | Payment calculator | ❌ |

### FastAPI ML Service (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ml/predict` | Credit risk prediction |
| GET | `/ml/models` | Available models |

---

## 💳 Loan Products Database

Real APR rates from actual lenders (LendingClub data):

| Lender | Products | APR Range | Credit Score | Loan Type |
|--------|----------|-----------|--------------|-----------|
| **LendingClub** | 8 | 5.99% - 28.99% | 620-850 | Personal, Debt, Home, Car |
| **SoFi** | 1 | 8.99% - 12.99% | 720-850 | Personal (No fees!) |
| **Prosper** | 1 | 8.99% - 17.99% | 680-719 | Personal (P2P) |
| **Upstart** | 1 | 12.99% - 29.99% | 620-679 | Personal (AI-powered) |
| **Marcus** | 1 | 6.99% - 19.99% | 720-850 | Debt Consolidation |
| **Discover** | 1 | 7.99% - 24.99% | 680-719 | Personal |

---

## 🚀 Quick Start

### Prerequisites

| Software | Version | Installation |
|----------|---------|--------------|
| Java | 17+ | `brew install openjdk@17` |
| Maven | 3.8+ | `brew install maven` |
| Node.js | 18+ | `brew install node` |
| PostgreSQL | 14+ | `brew install postgresql@15` |
| Python | 3.10+ | `brew install python` |
| Nginx | 1.24+ | `brew install nginx` |

### 1️⃣ Database Setup

```bash
# Start PostgreSQL
brew services start postgresql@15

# Create database
psql -U $(whoami) -d postgres -c "CREATE DATABASE creditwise;"
```

### 2️⃣ Spring Boot Backend (Java)

```bash
cd spring-backend

# Set Java path (macOS)
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"

# Run application
./mvnw spring-boot:run

# API available at: http://localhost:8080/api
# Swagger UI at: http://localhost:8080/api/swagger-ui.html
```

### 3️⃣ FastAPI ML Service (Python)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python run.py

# API available at: http://localhost:8000
```

### 4️⃣ React Frontend

```bash
cd "Design CreditWise Platform"

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3001
```

### 5️⃣ Nginx (Production)

```bash
# Copy configuration
cp nginx/nginx.conf /opt/homebrew/etc/nginx/nginx.conf

# Start Nginx
brew services start nginx

# Access at http://localhost
```

---

## 🤖 Deep Learning Models

### Performance Comparison (AUC-ROC)

| Rank | Model | AUC-ROC | Type | Innovation |
|------|-------|---------|------|------------|
| 🥇 | **TFT** | **0.7745** | Deep Learning | Variable selection + temporal attention |
| 🥈 | **LSTM** | **0.7740** | Deep Learning | Bidirectional sequence modeling |
| 🥉 | XGBoost | 0.7665 | Traditional ML | Gradient boosting |
| 4 | LightGBM | 0.7664 | Traditional ML | Leaf-wise tree growth |
| 5 | Random Forest | 0.7663 | Traditional ML | Ensemble trees |
| 6 | FT-Transformer | 0.7647 | Deep Learning | Feature tokenization |
| 7 | **SAINT** | 0.7632 | Deep Learning | Intersample attention |
| 8 | Logistic Regression | 0.7494 | Traditional ML | Linear baseline |

### Train Models

```bash
cd notebooks

# Train best model (TFT)
python train_tft_credit_default.py

# Train fully-annotated SAINT
python train_saint_credit_default.py
```

---

## 💼 Skills Demonstrated

### Backend Development (Java)
- ☕ **Spring Boot 3.2**: Modern Java framework with auto-configuration
- 🔐 **Spring Security**: JWT authentication, BCrypt password hashing
- 🗄️ **Spring Data JPA**: ORM with Hibernate, custom queries
- 📄 **OpenAPI/Swagger**: Auto-generated API documentation
- 🏗️ **Clean Architecture**: Controller → Service → Repository pattern

### DevOps & Infrastructure
- 🔧 **Nginx**: Reverse proxy, load balancing, SSL termination
- 🐳 **Docker**: Containerization, multi-stage builds
- 🚀 **CI/CD**: GitHub Actions automated pipeline

### Full-Stack Development
- ⚛️ **React 18**: Hooks, TypeScript, modern patterns
- 🎨 **Tailwind CSS**: Utility-first styling
- 📊 **Data Visualization**: Recharts, custom SVG components

### Machine Learning
- 🧠 **Deep Learning**: PyTorch, Transformers, attention mechanisms
- 📈 **MLOps**: Model versioning, evaluation metrics

---

## 🧪 API Testing

### Test with cURL

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "fullName": "Test User"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Get loan products
curl http://localhost:8080/api/loans/products
```

### Swagger UI

Open http://localhost:8080/api/swagger-ui.html for interactive API testing.

---

## 🗺️ Roadmap

- [x] SQL feature engineering pipeline
- [x] Traditional ML models (XGBoost, LightGBM)
- [x] Deep learning models (TFT, LSTM, SAINT, FT-Transformer)
- [x] React frontend with loan eligibility checker
- [x] FastAPI backend (Python ML service)
- [x] PostgreSQL database integration
- [x] LendingClub loan products data
- [x] **Spring Boot backend (Java)** ✨ NEW
- [x] **Nginx reverse proxy** ✨ NEW
- [x] **Docker containerization** ✨ NEW
- [ ] Integrate trained ML model into Spring Boot
- [ ] Kubernetes deployment
- [ ] Real-time prediction API

---

## 📚 References

### Technologies
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### Dataset & Loan Data
- UCI Default of Credit Card Clients - [DOI](https://doi.org/10.24432/C55S3H)
- LendingClub Public Rate Sheets and SEC Filings

### Model Papers
- **SAINT**: Somepalli et al., "SAINT: Improved Neural Networks for Tabular Data" (2021)
- **TFT**: Lim et al., "Temporal Fusion Transformers for Time Series Forecasting" (2021)
- **FT-Transformer**: Gorishniy et al., "Revisiting Deep Learning for Tabular Data" (2021)

---

## 📝 License

MIT License - Free to use for portfolio and learning purposes

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ to demonstrate full-stack enterprise development skills
</p>
<p align="center">
  <b>Java Spring Boot</b> • <b>React</b> • <b>PostgreSQL</b> • <b>PyTorch</b> • <b>Nginx</b> • <b>Docker</b>
</p>
