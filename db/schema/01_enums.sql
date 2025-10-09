-- Enumerated types used across DropMate tables.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin', 'support');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'pending', 'suspended', 'disabled');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'draft',
            'submitted',
            'confirmed',
            'ready_for_dispatch',
            'in_transit',
            'fulfilled',
            'cancelled'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending',
            'authorized',
            'settled',
            'failed',
            'refunded'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE assignment_status AS ENUM (
            'pending',
            'accepted',
            'en_route',
            'arrived',
            'delivered',
            'handed_off',
            'rejected',
            'cancelled'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
        CREATE TYPE shipment_status AS ENUM (
            'pending',
            'ready',
            'assigned',
            'in_transit',
            'delivered',
            'returned',
            'cancelled'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'route_stop_type') THEN
        CREATE TYPE route_stop_type AS ENUM ('pickup', 'dropoff', 'break', 'hub');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_channel') THEN
        CREATE TYPE message_channel AS ENUM ('web', 'mobile', 'wechat', 'system');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_event_status') THEN
        CREATE TYPE webhook_event_status AS ENUM (
            'pending',
            'delivered',
            'failed',
            'permanent_failure'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_location_source') THEN
        CREATE TYPE driver_location_source AS ENUM (
            'foreground',
            'background',
            'manual',
            'external'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type') THEN
        CREATE TYPE report_type AS ENUM ('daily', 'ad_hoc');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM ('pending', 'running', 'succeeded', 'failed');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_event_type') THEN
        CREATE TYPE shipment_event_type AS ENUM (
            'status_update',
            'eta_update',
            'location_snapshot',
            'note',
            'exception'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_shift_action') THEN
        CREATE TYPE driver_shift_action AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');
    END IF;
END$$;
