-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100),
    license_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create driver location events table
CREATE TABLE IF NOT EXISTS driver_location_events (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test driver
INSERT INTO drivers (id, name, vehicle_type, license_number, status)
VALUES (1, 'Test Driver', 'Sedan', 'ABC123', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_driver_location_events_driver_id_occurred_at
ON driver_location_events(driver_id, occurred_at DESC);
