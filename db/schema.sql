-- Enable UUID extension for secure, non-sequential IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (The Client)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    subscription_tier TEXT DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Locations (The specific Kitchen/Site)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    timezone TEXT DEFAULT 'America/Edmonton',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Staff (Kiosk-style access)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT,
    pin_hash TEXT NOT NULL, -- 4-digit PIN stored securely
    is_active BOOLEAN DEFAULT true
);

-- 4. Stations & SOP Templates
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Cold Storage', 'Sanitation'
    icon TEXT, -- Lucide icon name
    -- The JSONB column allows for custom SOP fields per station
    sop_config JSONB NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. The Logs (The Audit Trail)
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id),
    entry_data JSONB NOT NULL, -- Stores the actual readings (temps, ppm)
    is_breach BOOLEAN DEFAULT false,
    source_type TEXT DEFAULT 'manual', -- 'manual', 'sensor', 'bluetooth'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Corrective Actions (Linked to Breaches)
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id UUID REFERENCES logs(id) ON DELETE CASCADE,
    action_taken TEXT NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Schedules (The Master Blueprint)
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    window_start TIME NOT NULL, -- e.g., '08:00'
    window_end TIME NOT NULL, -- e.g., '12:00'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Schedule Instances (The Daily Manifest)
CREATE TABLE schedule_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    window_start TIME NOT NULL,
    window_end TIME NOT NULL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'MISSED'
    completed_log_id UUID REFERENCES logs(id), -- Nullable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(schedule_id, target_date)
);

-- Active Generator (Call this on Kiosk/Dashboard loads to ensure daily generation)
CREATE OR REPLACE FUNCTION generate_daily_schedules()
RETURNS void AS $$
BEGIN
  INSERT INTO schedule_instances (schedule_id, station_id, target_date, window_start, window_end, status)
  SELECT 
    id AS schedule_id,
    station_id,
    CURRENT_DATE AS target_date,
    window_start,
    window_end,
    'PENDING'
  FROM schedules
  ON CONFLICT (schedule_id, target_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;