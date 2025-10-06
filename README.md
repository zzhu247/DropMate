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
- **Worker Service** — runs scheduled tasks (ETA updates, report generation)  
- **Database (PostgreSQL)** — relational data store with persistent volume  
- **Object Storage** — stores images and generated PDF/Excel reports  
- **External Services** — WeChat, SMS, Map APIs for ETA

### Diagram
```
Client (Web / WeChat)
     |
     v
[ Web Frontend (Next.js) ]
     |
     v
[ API Gateway (Node.js/NestJS) ] ---> PostgreSQL (Persistent Volume)
     | \
     |  \-> Worker (Cron / PDF Report)
     |  
     +-> External Services (WeChat, Maps, SMS)
     |
   [ Object Storage (DO Spaces) ]
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

  api:
    build: ../api
    env_file: ../api/.env.local
    depends_on: [db]
    ports: ["3000:3000"]

  web:
    build: ../web
    depends_on: [api]
    ports: ["3001:3000"]

  worker:
    build: ../worker
    depends_on: [db, api]

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
- Deployments for API, Web, Worker
- StatefulSet for PostgreSQL with Persistent Volume
- CronJob for daily dispatch reports
- Ingress routing for HTTPS endpoints
- Metrics and alerting via DigitalOcean dashboard

---

## 💾 State & Persistence

- PostgreSQL runs in a StatefulSet with 20GB PersistentVolumeClaim.
- Backups handled via pg_dump to object storage (DO Spaces).
- Order and payment operations use idempotency to avoid duplication.

---

## 🔍 Monitoring & Observability

- CPU, memory, and disk metrics collected via DigitalOcean monitoring.
- Alerts triggered for:
  - CPU > 80% (5 minutes)
  - Pod restarts > 3/hour
  - Disk usage > 80%
- App endpoints `/healthz` and `/readyz` used for readiness probes.
- Logs viewable via DigitalOcean dashboard or CLI.

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
| DOKS Cluster (2 vCPU, 4GB) | Compute | $20–$40 |
| Load Balancer | Networking | $12 |
| Block Storage (20–50GB) | Persistent Data | $2–$5 |
| Object Storage (Spaces) | Media/Reports | $5 |
| Backups / Registry | Misc | $5–$10 |
| **Total (Monthly)** | **~$45–$70** |

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
DATABASE_URL=postgresql://app:app_pw@postgres.dropmate.svc.cluster.local:5432/dropmate
JWT_SECRET=REDACTED
WECHAT_APP_ID=REDACTED
WECHAT_APP_SECRET=REDACTED
SMS_PROVIDER_KEY=REDACTED
STORAGE_BUCKET=dropmate-media
```

---

## ✅ Deliverables

- `docker-compose.yml`
- `k8s/*.yaml`
- `Dockerfile` for all services
- This `README.md`
- Recorded demo (local + cloud)
- Cost and monitoring summary

