-- Core identity tables.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'pending',
    last_login_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS wechat_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    open_id TEXT NOT NULL UNIQUE,
    union_id TEXT UNIQUE,
    nickname TEXT,
    avatar_url TEXT,
    raw_profile JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    full_name TEXT,
    preferred_language TEXT,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    wechat_account_id UUID REFERENCES wechat_accounts (id),
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    employment_status TEXT NOT NULL DEFAULT 'active',
    compliance_flags JSONB NOT NULL DEFAULT '{}'::JSONB,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_profiles (
    driver_id UUID PRIMARY KEY REFERENCES drivers (id) ON DELETE CASCADE,
    display_name TEXT,
    vehicle_type TEXT,
    license_number TEXT,
    license_expiration DATE,
    vehicle_capacity INTEGER,
    service_region_geojson JSONB,
    emergency_contact JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    device_info JSONB NOT NULL DEFAULT '{}'::JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    device_identifier TEXT NOT NULL,
    push_token TEXT,
    background_location_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT driver_devices_unique_identity UNIQUE (driver_id, platform, device_identifier)
);

CREATE TABLE IF NOT EXISTS driver_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
    device_id UUID REFERENCES driver_devices (id) ON DELETE SET NULL,
    auth_session_id UUID REFERENCES auth_sessions (id) ON DELETE SET NULL,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    app_version TEXT,
    location_sharing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_shift_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
    action driver_shift_action NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
