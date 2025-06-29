# Eligibility Checker - Full Stack Application

A complete full-stack application demonstrating modern development practices with Angular frontend, Node.js backend, PostgreSQL database, Docker containerization, Kubernetes deployment, and CI/CD pipeline.

## 🏗️ Project Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Angular SPA   │    │  Node.js API    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Docker Container│    │ Docker Container│    │ Docker Container│
│     + Nginx      │    │   + TypeScript  │    │   + Init SQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Jaeger    │ │ Prometheus  │ │   Grafana   │ │ Monitoring  ││
│  │ (Tracing)   │ │ (Metrics)   │ │(Dashboard)  │ │   Stack     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
eligibility-checker/
├── .github/workflows/
│   └── ci-cd.yml                    # GitHub Actions CI/CD pipeline
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── utils/
│   │   │   └── database.ts
│   │   ├── server.ts                # Main server file
│   │   └── telemetry.ts            # OpenTelemetry setup
│   ├── tests/
│   │   ├── server.test.ts
│   │   └── setup.ts
│   ├── Dockerfile                   # Production backend container
│   ├── Dockerfile.dev              # Development backend container
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .env                        # Environment variables (not in git)
├── database/
│   ├── Dockerfile                  # PostgreSQL container
│   └── init.sql                    # Database schema and setup
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── eligibility/
│   │   │   │   └── stats/
│   │   │   ├── services/
│   │   │   │   └── eligibility.service.ts
│   │   │   ├── app.component.ts
│   │   │   ├── app.module.ts
│   │   │   └── app-routing.module.ts
│   │   └── environments/
│   ├── Dockerfile                  # Production frontend container
│   ├── Dockerfile.dev             # Development frontend container
│   ├── nginx.conf                 # Nginx configuration for production
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── k8s/                           # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── database-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── monitoring.yaml
├── docker-compose.yml             # Development orchestration
├── docker-compose.prod.yml        # Production orchestration
├── sonar-project.properties       # SonarQube configuration
└── README.md                      # This file
```

## ✨ Features

### Frontend (Angular 18)
- ✅ **Material Design** UI components
- ✅ **Responsive design** with mobile support
- ✅ **Form validation** with real-time feedback
- ✅ **Routing** between eligibility check and statistics
- ✅ **HTTP service** with error handling and retry logic
- ✅ **Loading states** and user feedback

### Backend (Node.js + TypeScript)
- ✅ **Express.js** REST API
- ✅ **TypeScript** for type safety
- ✅ **PostgreSQL** integration with connection pooling
- ✅ **Input validation** using Joi schemas
- ✅ **Security middleware** (Helmet, CORS, rate limiting)
- ✅ **Structured logging** with Winston
- ✅ **Health checks** and readiness probes
- ✅ **OpenTelemetry** distributed tracing

### Database (PostgreSQL 15)
- ✅ **Optimized schema** with indexes and constraints
- ✅ **Database triggers** for automatic timestamps
- ✅ **Views** for statistics calculations
- ✅ **Connection pooling** for performance
- ✅ **Health checks** and monitoring

### DevOps & Infrastructure
- ✅ **Docker** multi-stage builds for optimization
- ✅ **Docker Compose** for local development
- ✅ **Kubernetes** deployment manifests
- ✅ **GitHub Actions** CI/CD pipeline
- ✅ **SonarQube** code quality analysis
- ✅ **Jest** testing with coverage requirements
- ✅ **Security scanning** with container vulnerability checks

### Monitoring & Observability
- ✅ **Distributed tracing** with Jaeger
- ✅ **Metrics collection** with Prometheus
- ✅ **Visualization** with Grafana
- ✅ **Error tracking** with monitoring stack
- ✅ **Health checks** across all services

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+ (for local development)
- VS Code (recommended)
- Git

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd eligibility-checker
```

### 2. Environment Configuration
```bash
# Copy environment template (create if needed)
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```bash
NODE_ENV=development
PORT=3000
DB_HOST=database
DB_PORT=5432
DB_NAME=eligibility_db
DB_USER=postgres
DB_PASSWORD=password
LOG_LEVEL=info
```

### 3. Start Development Environment
```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access Applications
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **Database**: localhost:5433 (postgres/password)

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend
npm test

# Backend tests with coverage
npm run test:coverage

# Frontend tests
cd frontend
ng test

# Frontend tests with coverage
ng test --code-coverage
```

### Integration Testing
```bash
# Start test environment
docker-compose up -d database

# Run integration tests
cd backend
npm run test:integration
```

## 📊 Code Quality

### SonarQube Analysis
```bash
# Start SonarQube (if using local instance)
docker run -d --name sonarqube -p 9000:9000 sonarqube:community

# Run analysis
npm run sonar-scanner
```

### Coverage Requirements
- **Minimum Coverage**: 80% across all metrics
- **Quality Gate**: Must pass SonarQube analysis
- **Linting**: ESLint for backend, Angular ESLint for frontend

## 🏗️ Development Workflow

### Local Development
```bash
# Start development environment
docker-compose up -d

# Make code changes (hot reload enabled)
# Frontend: Changes in src/ automatically reload
# Backend: Changes in src/ restart server via nodemon

# View real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (AWS EKS, GCP GKE, or local)
- kubectl configured
- Docker images pushed to registry

### Deploy to Kubernetes
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (update with your values first)
kubectl apply -f k8s/secrets.yaml

# Deploy database
kubectl apply -f k8s/database-deployment.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy monitoring (optional)
kubectl apply -f k8s/monitoring.yaml
```

### Verify Deployment
```bash
# Check pod status
kubectl get pods -n eligibility-app

# Check services
kubectl get services -n eligibility-app

# View logs
kubectl logs -f deployment/backend -n eligibility-app
```

## 🔄 CI/CD Pipeline

The GitHub Actions pipeline automatically:

### On Pull Request
1. **Code Quality**: ESLint, TypeScript compilation
2. **Testing**: Unit tests with coverage reporting
3. **Security**: Dependency vulnerability scanning
4. **SonarQube**: Static code analysis

### On Merge to Main
1. **Build**: Docker images for all services
2. **Test**: Integration tests with real database
3. **Security**: Container vulnerability scanning
4. **Deploy**: Automatic deployment to staging/production
5. **Monitor**: Health checks and rollback if needed

### Required Secrets
Set these in GitHub repository settings:
```bash
SONAR_TOKEN=your_sonar_token
DOCKER_REGISTRY=your_registry_url
KUBE_CONFIG=your_kubernetes_config
AWS_ACCESS_KEY_ID=your_aws_key (if using AWS)
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

## 📈 Monitoring

### Application Metrics
- **Response times** and throughput
- **Error rates** and status codes
- **Database** connection pool status
- **Custom business metrics** (eligibility rates)

### Infrastructure Metrics
- **Container** resource usage
- **Database** performance metrics
- **Network** traffic and latency
- **Storage** usage and performance

### Accessing Monitoring
- **Jaeger UI**: http://localhost:16686 (tracing)
- **Prometheus**: http://localhost:9090 (metrics)
- **Grafana**: http://localhost:3001 (dashboards)

## 🔧 Configuration

### Environment Variables

#### Backend
```bash
NODE_ENV=development|production
PORT=3000
DB_HOST=database
DB_PORT=5432
DB_NAME=eligibility_db
DB_USER=postgres
DB_PASSWORD=password
LOG_LEVEL=debug|info|warn|error
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
```

#### Frontend
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  appName: 'Eligibility Checker'
};
```

## 🚨 Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Clean up containers and volumes
docker-compose down -v
docker system prune -f

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs database

# Test database connectivity
docker-compose exec database psql -U postgres -d eligibility_db -c "\dt"

# Reset database
docker-compose down -v
docker-compose up -d database
```

#### Port Conflicts
```bash
# Check what's using the ports
lsof -i :4200  # Frontend
lsof -i :3000  # Backend
lsof -i :5433  # Database

# Kill processes if needed
kill -9 <PID>
```

### Performance Optimization

#### Database
- Monitor query performance with `EXPLAIN ANALYZE`
- Ensure proper indexing on frequently queried columns
- Optimize connection pool settings

#### Application
- Monitor memory usage and garbage collection
- Implement caching strategies for frequently accessed data
- Use compression middleware for response optimization

#### Frontend
- Implement lazy loading for routes
- Optimize bundle sizes with tree shaking
- Use OnPush change detection strategy where appropriate

## 🔒 Security

### Implemented Security Measures
- **Input Validation**: Joi schemas with strict patterns
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for specific origins
- **Helmet**: Security headers middleware
- **XSS Protection**: Input sanitization
- **SQL Injection**: Parameterized queries only
- **Container Security**: Non-root users, minimal base images
- **Secrets Management**: Kubernetes secrets, environment variables

### Security Scanning
- **Trivy**: Container vulnerability scanning in CI/CD
- **SonarQube**: Static application security testing (SAST)
- **npm audit**: Dependency vulnerability checking
- **Snyk**: Continuous security monitoring (optional)

## 📝 API Documentation

### Core Endpoints

#### POST /api/check-eligibility
Check user eligibility for the program.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01"
}
```

**Response:**
```json
{
  "id": 123,
  "age": 33,
  "eligible": true,
  "message": "You are eligible for the program",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### GET /api/stats
Get application statistics.

**Response:**
```json
{
  "statistics": {
    "totalUsers": 150,
    "eligibleUsers": 120,
    "ineligibleUsers": 30,
    "averageAge": 28.5
  }
}
```

#### GET /health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {...},
  "version": "1.0.0"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Update documentation
7. Submit a pull request

### Code Style
- Follow ESLint rules for JavaScript/TypeScript
- Use Angular style guide for frontend components
- Write meaningful commit messages (conventional commits)
- Add JSDoc comments for functions

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review application logs: `docker-compose logs -f`

---

## 🎯 Next Steps

After getting the application running:

1. **Customize Business Logic**: Modify eligibility criteria as needed
2. **Add Features**: Implement additional form fields or validation rules
3. **Scale**: Configure auto-scaling and load balancing
4. **Monitor**: Set up alerting and monitoring dashboards
5. **Secure**: Implement authentication and authorization
6. **Optimize**: Performance tuning and caching strategies

# Eligibility Checker - Full Stack Application

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=eligibility-checker&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=eligibility-checker)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=eligibility-checker&metric=coverage)](https://sonarcloud.io/summary/new_code?id=eligibility-checker)

A modern full-stack application demonstrating enterprise-grade development practices with Angular, Node.js, PostgreSQL, Docker, and Kubernetes.

## 🏗️ Architecture

- **Frontend**: Angular 18 with Material Design
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL 15
- **Container**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with auto-scaling
- **Monitoring**: Jaeger, Prometheus, Grafana

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/eligibility-checker.git
cd eligibility-checker

# Copy environment file
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:4200
# Backend: http://localhost:3000/health
# Database: localhost:5433