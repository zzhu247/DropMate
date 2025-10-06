# DropMate: A Cloud-Native Local Delivery Platform ☁️🚚


## 🧩 Overview

**DropMate** is a **cloud-native delivery management platform** that enables customers to view ads, place and confirm orders, track deliveries with ETA updates, and communicate via message boards.  
The system also automates **daily dispatch report generation** and supports **WeChat-based ordering**.

The platform demonstrates **modern cloud computing practices**:
- Docker containerization
- Multi-service orchestration with Kubernetes
- Stateful data persistence (PostgreSQL + Persistent Volumes)
- Deployment on DigitalOcean or Fly.io
- Monitoring and metrics via provider tools

---

## 🏗️ Architecture

### Components
- **Frontend (Next.js)** — ad display, order pages, chat, confirmation links  
- **Backend API (Node.js/NestJS)** — handles business logic, REST/GraphQL endpoints  
- **Worker Service** — consumes async jobs from a queue (ETA refreshes, report generation triggers)  
- **Database (Managed PostgreSQL)** — regional HA relational data store  
- **Object Storage** — stores images and generated PDF/Excel reports  
- **External Services** — WeChat, SMS, Map APIs for ETA
- **Task Queue (Redis/BullMQ)** — coordinates background job dispatch

### Diagram
```
Client (Web / WeChat)
     |
     v
[ Web Frontend (Next.js) ]
     |
     v
[ API Gateway (Node.js/NestJS) ] ---> Managed PostgreSQL (HA cluster)
     |
     +-> Task Queue (Redis/BullMQ)
             |
             v
        Worker (Queue Consumers)
             |
           Object Storage (DO Spaces)
     |
     +-> External Services (WeChat, Maps, SMS)
     |
   Scheduler (K8s CronJob -> Queue)
```

---

## 🧱 Local Development (Docker & Compose)

### Folder Structure
```
dropmate/
 ├── web/                 # Frontend
 ├── api/                 # Backend API
 ├── worker/              # Background Jobs
 ├── db/seed/             # SQL seeds
 ├── compose/             # Docker Compose
 ├── k8s/                 # Kubernetes manifests
 └── README.md
```

### Docker Compose Setup
```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app_pw
      POSTGRES_DB: dropmate
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ../db/seed:/docker-entrypoint-initdb.d
    ports: ["5432:5432"]

  queue:
    image: redis:7
    ports: ["6379:6379"]

  api:
    build: ../api
    env_file: ../api/.env.local
    depends_on: [db, queue]
    ports: ["3000:3000"]

  web:
    build: ../web
    depends_on: [api]
    ports: ["3001:3000"]

  worker:
    build: ../worker
    depends_on: [db, queue, api]

volumes:
  pgdata:
```

Run locally:
```bash
cd compose
docker-compose up --build
```

---

## ☁️ Cloud Deployment (Kubernetes on DigitalOcean)

Includes:
- Deployments for API, Web, Worker (queue consumers) with HPA autoscaling
- DigitalOcean Managed PostgreSQL (multi-AZ) + read replica
- Managed Redis (DO) for BullMQ task queue with persistence
- CronJob that enqueues daily dispatch reports instead of running them inline
- Ingress routing for HTTPS endpoints (Cert Manager + DO Load Balancer)
- Metrics/alerts via Prometheus + Grafana managed stack

---

## 💾 State & Persistence

- PostgreSQL runs on DigitalOcean's managed cluster (primary + hot standby) with automatic failover.
- Hourly WAL archiving enables point-in-time recovery; nightly logical dumps copied to DO Spaces for air-gapped backups.
- Quarterly restore drills validate the runbooks and ensure RTO/RPO targets are realistic.
- Order and payment operations use idempotency tokens to avoid duplication during retries.

---

## 🔍 Monitoring & Observability

- Workloads emit OpenTelemetry traces + metrics scraped by Prometheus and visualized in Grafana (DO managed stack).
- Alerting rules cover CPU saturation, queue latency, HTTP error rate, and failed jobs; paging routed through PagerDuty.
- Structured JSON logs ship to Loki; 30-day retention with sampling for verbose debug events.
- App endpoints `/healthz` and `/readyz` drive readiness probes; `/metrics` exposes service-level indicators.

---

## 🔐 Security & Compliance

- TLS via Ingress and Cert Manager.
- Sensitive credentials stored in Kubernetes Secrets.
- Role-based access control (RBAC) with minimal privileges.
- User data (PII) encrypted at rest.
- Admin actions recorded in audit logs.

---

## 💰 Platform Cost Estimate (MVP)

| Resource | Type | Est. Monthly Cost |
|-----------|------|------------------|
| DOKS Cluster (2x nodes, 2 vCPU / 4GB) | Compute | $40–$80 |
| Load Balancer | Networking | $12 |
| Managed PostgreSQL (primary + standby) | Database | $60–$90 |
| Managed Redis (1GB) | Queue | $15–$20 |
| Object Storage (Spaces) | Media/Reports | $5 |
| Managed Prometheus/Grafana | Monitoring | $15 |
| Backups / Registry | Misc | $5–$10 |
| **Total (Monthly)** | **~$150–$220** |

---

## 🚀 CI/CD Workflow (GitHub Actions)

```bash
# 1. Build & Test
npm run test
docker build -t registry/dropmate/api:latest ./api

# 2. Push to Registry
docker push registry/dropmate/api:latest

# 3. Deploy to Kubernetes
kubectl apply -f k8s/
```

Rollback by redeploying the previous image tag.

---

## 📆 Project Timeline (6 Weeks)

| Week | Milestone |
|------|------------|
| **1** | Data schema + basic CRUD API |
| **2** | Ads + Orders + Message board |
| **3** | Delivery ETA + dispatch report generator |
| **4** | Kubernetes setup (Minikube) |
| **5** | Cloud deployment on DOKS + monitoring |
| **6** | Optimization + final demo recording |

---

## ⚙️ Environment Variables

```
DATABASE_URL=postgresql://app:app_pw@dropmate-db-do-user-12345-0.db.ondigitalocean.com:25060/dropmate?sslmode=require
JWT_SECRET=REDACTED
WECHAT_APP_ID=REDACTED
WECHAT_APP_SECRET=REDACTED
SMS_PROVIDER_KEY=REDACTED
STORAGE_BUCKET=dropmate-media
REDIS_URL=rediss://dropmate-queue-do-user-12345-0.db.ondigitalocean.com:25061/0
```

---

## ✅ Deliverables

- `docker-compose.yml`
- `k8s/*.yaml`
- `Dockerfile` for all services
- This `README.md`
- Recorded demo (local + cloud)
- Cost and monitoring summary
