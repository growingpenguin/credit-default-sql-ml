# 🐳 CreditWise Docker Configuration

This directory contains Docker configurations for deploying the CreditWise platform.

## 📁 Files

| File | Description |
|------|-------------|
| `Dockerfile.spring` | Multi-stage build for Spring Boot backend |
| `Dockerfile.fastapi` | Multi-stage build for FastAPI ML service |
| `Dockerfile.frontend` | Multi-stage build for React frontend |
| `docker-compose.yml` | Full stack orchestration |
| `nginx.docker.conf` | Nginx reverse proxy config for Docker |
| `nginx.frontend.conf` | Nginx config for frontend container |
| `.env.example` | Example environment variables |

## 🚀 Quick Start

### 1. Build and Start All Services

```bash
# From project root
cd docker

# Copy environment file
cp .env.example .env

# Build and start (detached mode)
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### 2. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **Main App** | http://localhost | Nginx reverse proxy |
| **Frontend** | http://localhost:3000 | React app |
| **Spring API** | http://localhost:8080/api | Java backend |
| **ML Service** | http://localhost:8000 | Python ML API |
| **PostgreSQL** | localhost:5432 | Database |

### 3. Stop Services

```bash
# Stop all
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v
```

## 🏗️ Architecture

```
                    ┌─────────────────┐
                    │     Nginx       │
                    │   (Port 80)     │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │  Frontend │    │  Spring   │    │  FastAPI  │
    │  (React)  │    │  Backend  │    │  ML Svc   │
    │  :3000    │    │  :8080    │    │  :8000    │
    └───────────┘    └─────┬─────┘    └───────────┘
                           │
                           ▼
                    ┌───────────┐
                    │ PostgreSQL│
                    │   :5432   │
                    └───────────┘
```

## 🔧 Building Individual Services

### Spring Boot

```bash
docker build -f docker/Dockerfile.spring -t creditwise-api:latest .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/creditwise \
  creditwise-api:latest
```

### FastAPI

```bash
docker build -f docker/Dockerfile.fastapi -t creditwise-ml:latest .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://creditwise:password@host.docker.internal:5432/creditwise \
  creditwise-ml:latest
```

### Frontend

```bash
docker build -f docker/Dockerfile.frontend -t creditwise-frontend:latest .
docker run -p 3000:80 creditwise-frontend:latest
```

## 🧪 Testing

### Check Health Endpoints

```bash
# Nginx proxy
curl http://localhost/health

# Spring Boot
curl http://localhost/api/health
curl http://localhost:8080/api/health

# FastAPI
curl http://localhost/ml/health
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000/health
```

### Test API

```bash
# Register user
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "fullName": "Test User"}'

# Get loan products
curl http://localhost/api/loans/products
```

## 📊 Monitoring

### View Container Status

```bash
docker-compose ps
```

### View Resource Usage

```bash
docker stats
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f spring-backend
docker-compose logs -f fastapi-ml
docker-compose logs -f frontend
docker-compose logs -f nginx
```

## 🔐 Production Considerations

1. **Change Secrets**: Update all passwords and JWT secrets in `.env`
2. **SSL/TLS**: Add SSL certificates to Nginx
3. **Scaling**: Use `docker-compose up --scale spring-backend=3`
4. **Monitoring**: Add Prometheus + Grafana
5. **Logging**: Configure centralized logging (ELK/Loki)

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Connect directly
docker exec -it creditwise-db psql -U creditwise -d creditwise
```

### Spring Boot Not Starting

```bash
# Check logs for errors
docker-compose logs spring-backend

# Rebuild
docker-compose up -d --build spring-backend
```

### Clear Everything and Start Fresh

```bash
docker-compose down -v --rmi all
docker-compose up -d --build
```

