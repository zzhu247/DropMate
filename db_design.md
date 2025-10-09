# DropMate Database Design

## Goals & Principles
- Model customer ordering, ad engagement, delivery fulfillment, and reporting in a relational schema optimized for OLTP workloads (PostgreSQL 16).
- Support mobile clients (customer + driver) and web experiences with consistent identity and authorization boundaries.
- Capture live driver telemetry with low-latency fan-out while persisting an auditable history of delivery progress.
- Enforce data integrity with foreign keys, enums, and idempotency guards; use partitioning/retention for high-volume append-only streams.

---

## High-Level Entity Map
```
users ─┬─< auth_sessions
       ├─1─ customers ─┬─< delivery_addresses
       │               └─< orders ─┬─< order_items
       │                           ├─1─ payments
       │                           └─< shipment_events
       └─1─ drivers ─1─ driver_profiles
                     ├─< driver_devices
                     ├─< driver_sessions
                     └─< driver_location_events

orders ─1─ shipments ─┬─< driver_assignments ─1─ drivers
                      ├─< route_stops
                      └─< shipment_events

ads ─< ad_impressions

message_threads ─< messages

dispatch_reports ─< report_runs
background_jobs >─ queue_payloads (logical)

api_audit_logs, webhooks, webhook_events, idempotency_keys, feature_flags, system_settings provide platform scaffolding.
```

---

## Domains & Tables

### Accounts & Identity
- `users` — canonical authentication record (email/phone, password hash, role enum `customer|driver|admin`, soft delete). Index on `email unique`, composite `(role, status)`.
- `customers` — profile data for ordering channels (name, marketing preferences, WeChat linkage). Optional FK to `wechat_accounts`.
- `drivers` — core driver entities with employment status, compliance flags; FK to `users`.
- `driver_profiles` — vehicle preference, license metadata, service region polygon (GeoJSON). One-to-one with `drivers`.
- `auth_sessions` — refresh tokens, device info, expiration for all user types. `ON DELETE CASCADE` from `users`.
- `driver_devices` — mobile device fingerprints + push tokens; unique composite `(driver_id, platform, device_identifier)`.
- `driver_sessions` — active app sessions/heartbeat (last_seen, app_version, background_location_enabled). Indexed by `(driver_id, last_seen DESC)` to determine availability.

### Commerce & Catalog
- `ads` — campaign metadata, targeting rules, media asset URL references.
- `ad_impressions` — append-only event stream (partitioned by month) capturing ad view context (timestamp, channel, customer_id optional). Index `(ad_id, occurred_at DESC)`.
- `products` — catalog items, inventory references for restocking.
- `orders` — ties customer (nullable for guest), delivery address, payment state, source channel (web, app, wechat). Status enum `draft|submitted|confirmed|fulfilled|cancelled`.
- `order_items` — line items with pricing snapshot, FK to `products`.
- `payments` — single row per order (for MVP). State enum `pending|authorized|settled|failed|refunded`. Includes processor references and `idempotency_key_id`.
- `refunds` — optional; references `payments`.
- `idempotency_keys` — enforces unique `(client_scope, external_ref)` to support safe retries.

### Fulfillment & Logistics
- `delivery_addresses` — normalized address details, geo coordinates; reused across orders.
- `shipments` — 1:1 with orders (enforced by unique constraint). Contains committed ETA, courier notes, `current_driver_location_id` (FK to latest location snapshot materialized for analytics).
- `driver_assignments` — pivot table linking shipments and drivers with assignment status enum `pending|accepted|en_route|arrived|delivered|handed_off|rejected`. Contains acceptance timestamps and `schedule_sequence` for multi-stop runs.
- `route_stops` — ordered stops per shipment (`stop_type enum pickup|dropoff|break`). Has `position` integer, expected arrival/departure.
- `driver_location_events` — high-volume telemetry (driver_id, recorded_at, lat, lng, speed, accuracy, source enum). Partitioned daily per driver (native Postgres partitioning). Latest row cached in Redis for realtime fan-out.
- `delivery_runs` — optional grouping of multiple shipments for batch dispatch (future extension).
- `vehicles` — assigned vehicles with capacity metadata; optional FK referenced from driver profile.
- `shipment_events` — delivery timeline (status changes, ETA updates, location snapshots at key events). Partitioned by month. Each event stores diff payload JSONB for audit.
- `scheduled_jobs` — captures cron-triggered jobs (e.g., nightly dispatch report) with next_run, last_run, error rows.

### Messaging & Engagement
- `message_threads` — conversation container; `context_type/context_id` polymorphic fields (order, ad campaign, support). Contains `channel` enum (web, app, wechat).
- `messages` — individual posts (author FK to users/drivers/customers via derived columns). Includes attachments metadata (link to `files`). Indexed by `(thread_id, created_at)`. Soft delete column.
- `tracking_sessions` — customer subscriptions to live tracking (customer_id, order_id, session_token, expires_at). Used for WebSocket authorization and audit.

### Operations & Reporting
- `dispatch_reports` — generated report metadata (report_date, type enum `daily|ad_hoc`, status, storage_url). Unique `(report_date, type)`.
- `report_runs` — individual job executions with FK to `dispatch_reports`, queue job ID, runtime metrics.
- `background_jobs` — persisted BullMQ metadata for reliability (job_id, queue, payload JSONB, status, retries, last_error). Useful for dashboards and manual replay.
- `files` — references to object storage (key, bucket, mime). Linked from `ads`, `messages`, `dispatch_reports`.
- `webhooks` — outbound integration endpoints with secrets. `webhook_events` stores delivery attempts, response code, retry schedule.
- `api_audit_logs` — captures admin and automated actions; JSONB diff of changed fields, actor reference, request metadata.
- `feature_flags` / `system_settings` — platform configuration toggles.

---

## Key Relationships
- `users` 1—1 `customers` (for self-service) and 1—1 `drivers`; allows employees to have driver + admin roles through `role` enum and join tables.
- `orders` optionally reference `customers` or anonymous contact info; `shipments` enforce `order_id` uniqueness for 1:1 relation.
- `driver_assignments.shipment_id` unique to ensure a single current driver; history tracked via `status` transitions and archived rows.
- `driver_location_events` references `driver_sessions` via optional `session_id` to correlate telemetry with device.
- `message_threads` link to orders or campaigns via `(context_type, context_id)` plus indexes to keep lookups efficient.
- `tracking_sessions` reference both `customers` and `orders`; TTL enforced by background cleanup job.

---

## Enums & Constraints
- Postgres `ENUM`s: `user_role`, `order_status`, `payment_status`, `assignment_status`, `route_stop_type`, `message_channel`, `job_status`, `webhook_event_status`.
- Monetary columns use `NUMERIC(12,2)` with `CHECK` constraints to prevent negative totals where inappropriate.
- `driver_location_events.accuracy` has `CHECK (accuracy > 0 AND accuracy < 200)` to filter outliers; telemetry insert trigger clamps unrealistic speeds.
- Soft deletes via `deleted_at` on `users`, `customers`, `drivers`, `message_threads`, `messages`, `ads`; partial unique indexes `WHERE deleted_at IS NULL`.
- Referential actions: `ON DELETE RESTRICT` for critical relationships (`orders` → `payments`), `ON DELETE CASCADE` for dependent data (`orders` → `order_items`, `shipments` → `route_stops`), `ON DELETE SET NULL` for `driver_assignments.driver_id` when reassigning.

---

## Partitioning, Indexing & Retention
- Partition `driver_location_events`, `ad_impressions`, `shipment_events`, `webhook_events` by month (or day for telemetry) using range partitions. Maintain default `max 30 days` retention for raw telemetry; roll up into `driver_location_hourly` materialized view.
- Critical indexes:
  - `orders`: `(customer_id, created_at DESC)`, `(status, created_at DESC)`.
  - `shipments`: `(status, promised_arrival_at)`, `(current_driver_location_id)`.
  - `driver_assignments`: unique `(shipment_id)`; partial index on `(driver_id, status)` for active loads.
  - `driver_sessions`: `(driver_id, last_seen DESC)`; TTL job cleans stale sessions.
  - `tracking_sessions`: unique `(order_id, session_token)`.
  - `background_jobs`: `(queue, status, created_at)` for monitoring dashboards.
- Materialized views: `active_driver_locations` (latest per driver) refreshed continuously via trigger; `daily_dispatch_summary` for BI.

---

## Realtime & Caching Considerations
- Realtime gateway publishes updates sourced from Redis keys `driver:{id}:location`, maintained by inserts into `driver_location_events`.
- `tracking_sessions` store WebSocket auth tokens; tokens expire using TTL job with notifications to disconnect clients.
- Workers propagate `shipment_events` to message queues ensuring consistent timeline across apps.

---

## Compliance & Auditing
- Use row-level security for `customers`, ensuring only owners and support roles access PII.
- `api_audit_logs` triggered on `orders`, `shipments`, `drivers`, `message_threads` to capture before/after JSON (exclude sensitive fields via column filters).
- GDPR readiness: implement `erase_customer` procedure that soft-deletes and anonymizes related data, retaining operational metrics in aggregate tables.

---

## Migration & Tooling Notes
- Prefer Prisma or TypeORM migrations auto-generated but reviewed manually to confirm partition DDL.
- Seed scripts create baseline enums, feature flags, admin user, and sample ads/products.
- Daily job archives old telemetry partitions to cheaper storage (CSV/Parquet) via COPY.
- Base schema DDL lives in `db/schema/*.sql`; execute files in numeric order when bootstrapping new environments.
- Schema diagram maintained in `docs/erd.drawio` (future work) reflecting entities above.
