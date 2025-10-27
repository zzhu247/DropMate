# DropMate Project Proposal — Docker-Compose Microservice Edition

## 1. Problem & Opportunity
- **Small businesses** rely on ad-hoc tools to coordinate orders, couriers, and customers, leading to missed deliveries and opaque timelines.
- **Customers** expect real-time updates and self-service tracking similar to third-party delivery platforms.
- **Drivers** need a simple way to receive assignments, update progress, and communicate issues.
- Existing marketplace apps solve these problems but charge high commissions and hide operational data. A self-hosted alternative restores control while keeping costs predictable.

## 2. Vision & Objectives
- Deliver a **microservice-based delivery management backend** that can be spun up locally or in the cloud using **Docker Compose**.
- Provide **real-time transparency** for managers, drivers, and customers through REST + WebSocket APIs.
- Demonstrate core skills in **containerization, service decomposition, persistent storage, monitoring, and automation** within a 4–5 week project window.

## 3. Solution Overview

### 3.1 Core Capabilities
| Capability | Description |
|------------|-------------|
| Order Orchestration | Managers create and track orders, dispatchers assign drivers, customers view status. |
| Driver Management | Maintain driver profiles, availability, and live locations. |
| Real-Time Updates | Stream delivery progress and location changes via WebSockets. |
| Notifications | Send email/SMS alerts for key delivery events. |
| Analytics Snapshot | Surface queue length, delivery durations, and driver load. |

### 3.2 Microservice Topology
```
Clients ─► API Gateway ─► [Identity | Order | Driver | Dispatch | Tracking | Notification]
                               │            │        │         │          │
                               └──► Redis (cache + pub/sub)     │
                                           │                    │
                                           └──► PostgreSQL database
```
- **API Gateway / BFF:** single entry point, JWT validation, aggregates data for web/mobile clients, terminates WebSocket connections.
- **Identity Service:** user registration/login, role management (manager, driver, customer), token issuance.
- **Order Service:** CRUD for orders, state machine for delivery lifecycle, publishes domain events.
- **Driver Service:** driver roster, availability updates, location ingestion.
- **Dispatch Service:** listens for new orders + available drivers, computes assignments, pushes results back to Order + Driver services.
- **Tracking Service:** persists timeline/status updates, powers customer-facing progress feed.
- **Notification Service:** consumes events (order assigned, out for delivery, delivered) and triggers email/SMS using external providers.

### 3.3 Data & Messaging
- **PostgreSQL (Dockerized):** shared relational database with separate schemas per service to preserve ownership boundaries.
- **Redis:** caching hot queries, rate-limiting, lightweight pub/sub for live updates.
- **Internal Events:** standardized event contracts (`order.created`, `driver.available`, `delivery.updated`) sent via Redis streams or NATS (if included).

## 4. Architecture & Tooling
| Layer | Technology | Notes |
|-------|------------|-------|
| Containers & Orchestration | Docker, Docker Compose | Base environment for local/staging. Compose file defines services, networks, volumes. |
| Services | Node.js (NestJS) or Python (FastAPI), Go for workers | Each service packaged with its own Dockerfile and test suite. |
| API Contracts | OpenAPI/AsyncAPI | Published from gateway and event schemas; enables client generation. |
| Persistence | PostgreSQL, Redis | Persistent volumes defined in Compose; migrations run via dedicated job container. |
| Messaging (optional) | NATS JetStream or Redis Streams | Asynchronous event propagation when service coupling must be minimized. |
| Observability | Prometheus, Grafana, Loki (optional) | Metrics/log stack running as Compose services for local insights. |
| CI/CD | GitHub Actions | Build, test, lint, and push images; optional deployment to Fly.io or other container host using Compose bundle. |

## 5. Execution Plan
| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Architecture & Scaffolding | Service templates, Dockerfiles, base Compose stack, shared libraries, OpenAPI draft. |
| 2 | Core Services | Identity + Order services functional with Postgres, gateway routing, auth flow, integration tests. |
| 3 | Dispatch & Tracking | Driver/Dispatch/Tracking services, Redis integration, WebSocket streaming demo. |
| 4 | Notifications & Observability | Notification pipeline, Prometheus/Grafana dashboards, backup scripts. |
| 5 | Hardening & Demo | End-to-end testing, load test smoke, documentation, demo walkthrough video. |

## 6. Team Responsibilities
| Member | Role | Ownership |
|--------|------|-----------|
| Kevin Lin | Lead Developer & Architect | Service contracts, gateway implementation, Compose orchestration. |
| Liz Zhu | DevOps & Automation Lead | Docker Compose optimization, GitHub Actions, monitoring stack, release process. |
| Paul Xiao | Data & Storage Engineer | Database schema design, migrations, backup/restore tooling, data access patterns. |
| David Cao | Quality & Observability Engineer | Test harnesses, synthetic monitoring, Grafana dashboards, alert tuning. |

## 7. Risk & Mitigation
- **Scope Creep:** keep MVP focused on backend APIs + minimal front-end demo; log stretch goals separately.
- **Service Sprawl:** apply domain-driven boundaries; consolidate if a service lacks unique logic.
- **Integration Complexity:** leverage contract tests (Pact/Postman) and nightly Compose-based integration runs.
- **Operational Load:** automated scripts for database backups, seed data, and local reset reduce manual toil.

## 8. Deliverables
- Docker Compose stack with documented services, environment variables, and startup workflow.
- REST + WebSocket endpoints with authentication and role-aware behavior.
- Automated tests (unit, contract, integration) executed via GitHub Actions.
- Monitoring dashboard showcasing service health and key KPIs.
- Project documentation: architecture overview, API references, runbooks, and future roadmap.

## 9. Future Extensions
- Deploy Compose stack to a managed environment (Fly.io, ECS, Azure Container Apps).
- Introduce route optimization microservice using external mapping APIs.
- Add multi-tenant support and billing hooks for SaaS deployment.
- Ship lightweight React/Flutter clients consuming the published APIs.

