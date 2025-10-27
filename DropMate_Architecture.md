# DropMate Architecture Design

## 1. Context and Goals
- **Business goal:** empower local businesses to self-manage deliveries with end-to-end visibility, low operating cost, and data ownership.
- **Technical goal:** demonstrate proficiency with containerized microservices, Kubernetes orchestration on Fly.io, persistent data, real-time updates, monitoring, CI/CD, and automated recovery.
- **Constraints:** small team (4 members), ≈4–5 week timeline, Fly.io deployment target, minimal reliance on third-party SaaS beyond managed email/SMS.

## 2. High-Level Architecture Overview
- **Clients:** web dashboard for managers, mobile-friendly driver app, customer tracking view. Clients communicate through an API gateway and receive live updates via WebSockets/Server-Sent Events.
- **Microservices:** domain-specific services for identity, orders, dispatch, drivers, customers, notifications, and tracking. Services expose RESTful APIs and publish domain events.
- **Data Layer:** shared PostgreSQL cluster (Fly Postgres) with per-service schemas and Fly volumes for durability. Redis (or Fly-compatible Upstash Redis) handles ephemeral caches and live location streams.
- **Messaging:** NATS JetStream (or Redis Streams, depending on Fly support) transports asynchronous domain events (order lifecycle, driver location) and decouples services.
- **Infra/Orchestration:** Kubernetes (K3s) cluster deployed on Fly.io Machines. Each service ships as a Docker container managed via Helm charts and Horizontal Pod Autoscalers (HPA).
- **Observability:** Prometheus + Grafana for metrics, Loki (optional) for logs, Jaeger (optional) for traces. Alertmanager triggers Slack notifications.
- **CI/CD & Ops:** GitHub Actions builds images, runs tests, and deploys to Fly via `flyctl` + Helm. Scheduled Kubernetes CronJobs handle PostgreSQL backups to Fly volumes / object storage.

```
Clients ──► Ingress ─► API Gateway ─► [Identity, Order, Driver, Dispatch, Tracking, Notification, Customer services]
                            │                 │         │         │          │           │
                            ▼                 └──────┬──┴──┬──────┴────┬─────┴─────────┘
                    Event Bus (NATS/Redis Streams)   │     │          │
                                                    ▼     ▼          ▼
                                         PostgreSQL (shared cluster) │
                                                    ▲                │
                                                    └────► Redis cache
```

## 3. Microservice Breakdown

### 3.1 API Gateway / BFF
- **Purpose:** single entry point for REST/WebSocket traffic, request authentication, rate limiting, and fan-out to downstream services.
- **Tech:** FastAPI or NestJS; Envoy/NGINX ingress; integrated OAuth2/JWT middleware.
- **Responsibilities:**
  - HTTP routing and protocol translation (GraphQL optional).
  - Session-less JWT validation with Identity service public keys.
  - WebSocket hub for manager dashboards and customer tracking.
  - Aggregated responses for UI-specific needs to minimize chattiness.

### 3.2 Identity Service
- **Domain:** user accounts, roles (manager, driver, customer), authentication flows.
- **Endpoints:** `/auth/register`, `/auth/login`, `/auth/token/refresh`, `/users/:id`.
- **Storage:** `users` schema in PostgreSQL; password hashes via Argon2; JWT signing keys rotated using Kubernetes secrets.
- **Collaboration:** publishes `user.created`, `user.updated`, `user.role_changed` events to messaging layer for other services to sync references.

### 3.3 Order Service
- **Domain:** order lifecycle (created → assigned → picked-up → delivered/cancelled).
- **Endpoints:** `/orders`, `/orders/:id/status`, `/orders/:id/events`.
- **Storage:** `orders` schema with relational references to users/drivers; uses Fly volume-backed Postgres.
- **Events:** emits `order.created`, `order.assigned`, `order.status_changed`; consumes driver availability and delivery updates.
- **Scalability:** horizontal pods behind HPA using CPU+request metrics; caching of hot order summaries in Redis.

### 3.4 Driver Service
- **Domain:** driver profiles, vehicle data, capacity, availability windows.
- **Endpoints:** `/drivers`, `/drivers/:id/availability`, `/drivers/:id/location`.
- **Storage:** `drivers` schema; ephemeral location snapshots kept in Redis with TTL.
- **Events:** consumes identity events for driver onboarding; emits `driver.availability_changed`, `driver.location_updated`.
- **Security:** RBAC ensures only dispatch managers can modify driver assignments.

### 3.5 Dispatch Service
- **Domain:** matching new orders to available drivers, route optimization hooks.
- **Algorithm:** rule-based MVP (nearest available driver) with pluggable strategy for future optimizations.
- **Workflow:** subscribes to `order.created` and `driver.availability_changed`; writes assignments back to Order service via REST; publishes `dispatch.assignment_proposed`.
- **Scaling:** stateless workers, CPU-bound; auto-scale based on queue depth (custom Prometheus metric).

### 3.6 Tracking Service
- **Domain:** live delivery timelines and customer-visible status.
- **Responsibilities:**
  - Ingests driver location updates (MQTT/WebSocket/REST) and updates Redis stream.
  - Persists `delivery_updates` to Postgres for historical auditing.
  - Broadcasts updates to API Gateway for WebSocket clients.
- **Protocols:** drivers send GPS pings via authenticated WebSocket or gRPC streaming.

### 3.7 Notification Service
- **Domain:** outbound notifications (push, SMS/email, Slack webhooks).
- **Workflow:** consumes order and tracking events to trigger alerts (e.g., order out for delivery).
- **Providers:** modular adapters for Twilio SendGrid, SMS (configurable via secrets).
- **Reliability:** stores pending notifications in Postgres with retry policy; leverages worker pods and Dead Letter Queue (DLQ) in messaging layer.

### 3.8 Customer Service (optional separation)
- **Domain:** customer preferences, saved addresses, communication token management.
- **Benefits:** isolates GDPR/data retention logic (delete requests, anonymization).

## 4. Data and Messaging Strategy
- **PostgreSQL cluster:**
  - Single Fly Postgres app with primary/secondary for resilience.
  - Per-service schemas and migrations managed via `golang-migrate`/`prisma` to enforce ownership boundaries.
  - Fly volumes ensure persistent storage; point-in-time backups using CronJob `pg_dump` to object storage (e.g., Fly Object Storage or AWS S3).
- **Redis (cache + streams):**
  - Live driver locations, session tokens, rate limit counters.
  - TTL-based caches for frequently accessed read models (order summaries, driver rosters).
- **Event bus:**
  - NATS JetStream recommended for lightweight pub/sub and durable subscriptions.
  - Subject naming `domain.action.version` (e.g., `order.created.v1`).
  - Dispatch, notification, and tracking services rely on events to stay decoupled.

## 5. Deployment Architecture on Fly.io
- **Cluster layout:**
  - Deploy K3s control plane across two Fly machines in the same Fly region for HA (or use Fly's managed Kubernetes if available).
  - Worker nodes auto-scale between 2–6 VMs depending on load; each service runs as a Kubernetes Deployment.
- **Networking:**
  - Fly global Anycast routing terminates TLS; ingress controller (NGINX/Contour) handles cluster routing.
  - Internal services communicate over Fly's private network (WireGuard overlay) with mTLS enforced via service mesh (Linkerd optional).
- **Scaling & Resilience:**
  - HPA for stateless services, leveraging metrics-server and Prometheus Adapter.
  - Stateful sets (Postgres, Redis) pinned to specific machines with attached volumes.
  - Pod disruption budgets and readiness probes ensure zero-downtime deploys.
- **Secrets & Config:**
  - Managed via Kubernetes Secrets sealed with SealedSecrets or SOPS.
  - ConfigMaps for service-level feature flags and integration endpoints.

## 6. Observability & Reliability
- **Metrics:** Prometheus scrapes service `/metrics`; Grafana dashboards per domain (orders throughput, driver availability, notification failures).
- **Tracing:** OpenTelemetry instrumentation; Jaeger optional for request tracing through API Gateway → services.
- **Logging:** Structured JSON logs shipped via Fluent Bit to Loki or Fly Log Shipper.
- **Alerting:** Alertmanager routes alerts to Slack/Email; on-call rotations defined for course project.
- **Health checks:** Liveness/readiness endpoints yield insight; synthetic monitors run from GitHub Actions nightly.

## 7. Security & Compliance
- **Authentication:** JWTs issued by Identity service; short-lived access tokens + refresh tokens; WebSocket subprotocol handshake verifies tokens.
- **Authorization:** role-based policies enforced at gateway and service layer (OPA sidecar optional for fine-grained control).
- **Transport security:** TLS termination at Fly load balancer; internal traffic encrypted via service mesh.
- **Secrets management:** Fly secrets for platform-level values, Kubernetes secrets for runtime; periodic key rotation.
- **Data protection:** PII isolated, encryption at rest (Postgres + backups) and in transit.

## 8. CI/CD and Automation
- **Pipeline flow:**
  1. PR triggers GitHub Actions → run lint/unit/integration tests, Docker image builds.
  2. On main branch merge, pipeline pushes images to Fly private registry.
  3. Helm chart deploy via `flyctl deploy` or ArgoCD (optional) updates cluster with canary rollout.
  4. Post-deploy smoke tests and Prometheus check; rollback automated if SLOs breached.
- **Branch strategy:** GitFlow-lite (feature branches → PR → main). Automated semantic version tags per service.
- **IaC:** Terraform or Pulumi captures Fly apps, volumes, DNS, secrets baseline; Helm manages K8s manifests.
- **Backups:** nightly CronJob runs `pg_dump` → stores in Fly volume + remote object storage; weekly restore drill to staging database.

## 9. Development & Testing Environments
- **Local dev:** Docker Compose spins up subset (Gateway, Identity, Order, Postgres, Redis, NATS). Developers run services locally with hot reload.
- **Staging:** separate Fly org/app namespace; mirrors production topology with reduced size; used for integration testing before promotion.
- **Testing strategy:**
  - Unit tests per service.
  - Contract tests between API Gateway and downstream services using Pact.
  - End-to-end smoke tests using Postman/Newman or k6.
  - Chaos experiments (optional) to simulate pod failures and verify resilience.

## 10. Team Ownership Mapping
- **Kevin (Architecture):** API Gateway, Dispatch service design, Fly deployment coordination.
- **Liz (DevOps):** Kubernetes manifests/Helm, CI/CD automation, HPA tuning.
- **Paul (Data):** PostgreSQL schemas, migration pipelines, backup/restore automation.
- **David (Monitoring/QA):** Observability stack, alerting rules, automated testing harnesses.

## 11. Future Enhancements
- Replace rule-based dispatch with ML-driven route optimization (integration with Mapbox/OSRM).
- Introduce customer-facing notification preferences and multi-channel opt-in compliance.
- Expand to multi-tenant architecture with organization isolation.
- Explore Fly's global regions for low-latency driver/customer experiences, using read replicas and geo-routing.

