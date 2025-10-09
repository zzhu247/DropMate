-- Secondary indexes and partial constraints.

CREATE INDEX IF NOT EXISTS users_role_status_idx ON users (role, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS customers_marketing_idx ON customers (marketing_opt_in) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS customers_user_idx ON customers (user_id);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS driver_sessions_driver_last_seen_idx ON driver_sessions (driver_id, last_seen DESC);

CREATE INDEX IF NOT EXISTS driver_devices_push_token_idx ON driver_devices (push_token) WHERE push_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS delivery_addresses_customer_idx ON delivery_addresses (customer_id);

CREATE INDEX IF NOT EXISTS orders_customer_created_idx ON orders (customer_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders (status, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);

CREATE INDEX IF NOT EXISTS ads_active_idx ON ads (active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS ad_impressions_ad_time_idx ON ad_impressions (ad_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS products_active_idx ON products (is_active);

CREATE INDEX IF NOT EXISTS shipments_status_promised_idx ON shipments (status, promised_arrival_at);
CREATE INDEX IF NOT EXISTS shipments_updated_idx ON shipments (updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS driver_assignments_active_shipment_idx
    ON driver_assignments (shipment_id)
    WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS driver_assignments_active_driver_idx
    ON driver_assignments (driver_id, status)
    WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS route_stops_shipment_position_idx ON route_stops (shipment_id, position);

CREATE INDEX IF NOT EXISTS driver_location_events_driver_time_idx
    ON driver_location_events (driver_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS driver_location_events_assignment_idx
    ON driver_location_events (assignment_id, recorded_at DESC)
    WHERE assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS shipment_events_shipment_time_idx
    ON shipment_events (shipment_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS tracking_sessions_expiry_idx ON tracking_sessions (expires_at);

CREATE INDEX IF NOT EXISTS message_threads_context_idx ON message_threads (context_type, context_id);

CREATE INDEX IF NOT EXISTS messages_thread_time_idx ON messages (thread_id, sent_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS dispatch_reports_status_idx ON dispatch_reports (status, report_date DESC);

CREATE INDEX IF NOT EXISTS report_runs_report_idx ON report_runs (report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS background_jobs_queue_status_idx ON background_jobs (queue_name, job_status, available_at);

CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON webhook_events (webhook_id, event_status, created_at DESC);

CREATE INDEX IF NOT EXISTS api_audit_logs_actor_time_idx ON api_audit_logs (actor_user_id, created_at DESC);

