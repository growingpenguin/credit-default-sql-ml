# ☸️ CreditWise Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the CreditWise platform.

## 📁 Directory Structure

```
k8s/
├── base/                      # Base resources (Kustomize)
│   ├── kustomization.yaml     # Kustomize configuration
│   ├── namespace.yaml         # creditwise namespace
│   ├── configmap.yaml         # Non-sensitive config
│   ├── secrets.yaml           # Sensitive config (base64)
│   ├── postgres.yaml          # PostgreSQL StatefulSet
│   ├── spring-backend.yaml    # Spring Boot Deployment
│   ├── fastapi-ml.yaml        # FastAPI Deployment
│   ├── frontend.yaml          # React Frontend Deployment
│   └── ingress.yaml           # Nginx Ingress
├── overlays/
│   ├── dev/                   # Development overlay
│   │   └── kustomization.yaml # 1 replica, local images
│   └── prod/                  # Production overlay
│       └── kustomization.yaml # 3 replicas, GHCR images
└── README.md
```

## 🏗️ Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Kubernetes Cluster          │
                    │                                     │
                    │  ┌──────────────────────────────┐  │
                    │  │      Nginx Ingress           │  │
                    │  │    (creditwise.local)        │  │
                    │  └────────────┬─────────────────┘  │
                    │               │                     │
                    │    ┌──────────┼──────────┐         │
                    │    │          │          │         │
                    │    ▼          ▼          ▼         │
                    │ ┌──────┐ ┌───────┐ ┌──────────┐   │
                    │ │React │ │Spring │ │ FastAPI  │   │
                    │ │ x2   │ │ x2    │ │   x2     │   │
                    │ └──────┘ └───┬───┘ └──────────┘   │
                    │              │                     │
                    │              ▼                     │
                    │        ┌──────────┐               │
                    │        │PostgreSQL│               │
                    │        │(StatefulS)│               │
                    │        └──────────┘               │
                    └─────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (minikube, kind, EKS, GKE, etc.)
- kubectl configured
- Kustomize (built into kubectl v1.14+)
- Docker images built and pushed

### 1. Build Docker Images

```bash
# From project root
cd credit-default-sql-ml

# Build images
docker build -f docker/Dockerfile.spring -t creditwise/spring-backend:latest .
docker build -f docker/Dockerfile.fastapi -t creditwise/fastapi-ml:latest .
docker build -f docker/Dockerfile.frontend -t creditwise/frontend:latest .

# Push to registry (example: Docker Hub)
docker push creditwise/spring-backend:latest
docker push creditwise/fastapi-ml:latest
docker push creditwise/frontend:latest
```

### 2. Deploy to Kubernetes

#### Development Environment

```bash
# Preview what will be deployed
kubectl kustomize k8s/overlays/dev

# Deploy to dev
kubectl apply -k k8s/overlays/dev

# Check status
kubectl get all -n creditwise-dev
```

#### Production Environment

```bash
# Preview
kubectl kustomize k8s/overlays/prod

# Deploy to prod
kubectl apply -k k8s/overlays/prod

# Check status
kubectl get all -n creditwise
```

### 3. Access the Application

#### Local Development (minikube)

```bash
# Enable ingress
minikube addons enable ingress

# Add to /etc/hosts
echo "$(minikube ip) creditwise.local" | sudo tee -a /etc/hosts

# Access at http://creditwise.local
```

#### Port Forward (any cluster)

```bash
# Frontend
kubectl port-forward -n creditwise svc/frontend 3000:80

# Spring Boot API
kubectl port-forward -n creditwise svc/spring-backend 8080:8080

# FastAPI ML
kubectl port-forward -n creditwise svc/fastapi-ml 8000:8000
```

## 📋 Resource Summary

| Service | Replicas (Dev) | Replicas (Prod) | Memory | CPU |
|---------|----------------|-----------------|--------|-----|
| PostgreSQL | 1 | 1 | 512Mi | 500m |
| Spring Boot | 1 | 3 | 1Gi | 1000m |
| FastAPI ML | 1 | 3 | 2Gi | 1000m |
| Frontend | 1 | 2 | 128Mi | 200m |

## 🔧 Configuration

### ConfigMap (Non-Sensitive)

```yaml
# k8s/base/configmap.yaml
POSTGRES_DB: creditwise
SPRING_PROFILES_ACTIVE: prod
ML_SERVICE_URL: http://fastapi-ml:8000
```

### Secrets (Sensitive)

```bash
# Create secrets (example)
kubectl create secret generic creditwise-secrets \
  --from-literal=POSTGRES_PASSWORD=your_password \
  --from-literal=JWT_SECRET=your_jwt_secret \
  -n creditwise
```

## 🔍 Monitoring

### View Logs

```bash
# All pods
kubectl logs -n creditwise -l app.kubernetes.io/part-of=creditwise-platform

# Specific service
kubectl logs -n creditwise -l app=spring-backend -f
```

### Health Checks

```bash
# All pods status
kubectl get pods -n creditwise

# Describe unhealthy pod
kubectl describe pod <pod-name> -n creditwise
```

## 🗑️ Cleanup

```bash
# Delete development
kubectl delete -k k8s/overlays/dev

# Delete production
kubectl delete -k k8s/overlays/prod

# Or delete by namespace
kubectl delete namespace creditwise
```

## 📚 Additional Resources

- [Kustomize Documentation](https://kustomize.io/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [StatefulSets for Databases](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

