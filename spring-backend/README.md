# CreditWise Spring Boot Backend

Java Spring Boot backend for the CreditWise Mini Bank Platform.

## 🚀 Quick Start

### Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL 14+

### Run the Application

```bash
# Navigate to spring-backend directory
cd spring-backend

# Run with Maven
./mvnw spring-boot:run

# Or build and run JAR
./mvnw clean package
java -jar target/creditwise-api-1.0.0.jar
```

The API will be available at:
- **API Base**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html
- **API Docs**: http://localhost:8080/api/api-docs

## 📁 Project Structure

```
spring-backend/
├── src/main/java/com/creditwise/
│   ├── CreditWiseApplication.java    # Main application
│   ├── config/
│   │   ├── SecurityConfig.java       # Spring Security + JWT
│   │   ├── DataLoader.java           # Seeds loan products
│   │   └── GlobalExceptionHandler.java
│   ├── controller/
│   │   ├── AuthController.java       # /auth endpoints
│   │   ├── UserController.java       # /users endpoints
│   │   ├── LoanController.java       # /loans endpoints
│   │   └── HealthController.java
│   ├── dto/                          # Data Transfer Objects
│   ├── entity/
│   │   ├── User.java
│   │   └── LoanProduct.java
│   ├── repository/                   # JPA Repositories
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── CustomUserDetailsService.java
│   └── service/
│       ├── AuthService.java
│       ├── UserService.java
│       └── LoanService.java
├── src/main/resources/
│   └── application.yml               # Configuration
└── pom.xml                           # Maven dependencies
```

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile/financial` | Update financial info |
| POST | `/api/users/calculate-score` | Calculate credit score |
| GET | `/api/users/credit-score` | Get credit score |

### Loans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans/products` | All loan products |
| GET | `/api/loans/products/{id}` | Single product |
| GET | `/api/loans/recommendations` | Personalized recommendations |
| GET | `/api/loans/calculate-payment` | Payment calculator |

## 🔐 Security

- **JWT Authentication**: Token-based auth with configurable expiration
- **BCrypt Password Hashing**: Secure password storage
- **CORS Configuration**: Configured for frontend origins

## 📊 Database

Uses PostgreSQL with JPA/Hibernate. Tables are auto-created on startup.

### Environment Variables

```bash
DB_USERNAME=your_username
DB_PASSWORD=your_password
JWT_SECRET=your-base64-encoded-secret
```

## 🧪 Testing

```bash
# Run tests
./mvnw test

# Test with coverage
./mvnw test jacoco:report
```

## 📦 Build for Production

```bash
# Build JAR
./mvnw clean package -DskipTests

# Run JAR
java -jar target/creditwise-api-1.0.0.jar --spring.profiles.active=prod
```

