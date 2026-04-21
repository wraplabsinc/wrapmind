-- ============================================================
-- Add missing tables to prod (auth + core app tables)
-- Safe: does NOT touch existing tables (estimates, vehicles, customers)
-- Run first before 20250417000001_prd_missing_tables.sql
-- ============================================================

-- locations
CREATE TABLE IF NOT EXISTS locations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  address     text,
  city        text,
  state       text,
  zip         text,
  phone       text,
  color       text        DEFAULT '#3B82F6',
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT NOW(),
  updated_at  timestamptz DEFAULT NOW()
);

-- profiles (user accounts — linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        UNIQUE NOT NULL,
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  full_name   text,
  role        text        DEFAULT 'estimator' CHECK (role IN ('owner', 'admin', 'manager', 'estimator', 'installer')),
  avatar_url  text,
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT NOW()
);

-- profile_locations (many-to-many: team member ↔ location)
CREATE TABLE IF NOT EXISTS profile_locations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id      uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  role_at_location text,
  is_active        boolean     DEFAULT true,
  UNIQUE(profile_id, location_id)
);

-- appointments
CREATE TABLE IF NOT EXISTS appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id      uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  estimate_id      uuid,
  customer_id      uuid,
  vehicle_id       uuid,
  technician_id    uuid,
  service          text,
  date             date        NOT NULL,
  start_time       time        NOT NULL,
  end_time         time,
  status           text        DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  reminder_queued   boolean     DEFAULT false,
  reminder_sent     boolean     DEFAULT false,
  reminder_at       timestamptz,
  notes             text,
  created_at        timestamptz DEFAULT NOW(),
  updated_at        timestamptz DEFAULT NOW()
);

-- leads
CREATE TABLE IF NOT EXISTS leads (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id         uuid,
  name                text        NOT NULL,
  phone               text,
  email               text,
  source              text,
  service_interest    text,
  budget              decimal(10,2),
  priority            text        DEFAULT 'warm' CHECK (priority IN ('hot', 'warm', 'cold')),
  status              text        DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'scheduled', 'won', 'lost')),
  assignee_id         uuid,
  customer_id         uuid,
  notes               text,
  created_at          timestamptz DEFAULT NOW(),
  updated_at          timestamptz DEFAULT NOW()
);

-- employees
CREATE TABLE IF NOT EXISTS employees (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id  uuid,
  name        text        NOT NULL,
  initials    text,
  role        text        DEFAULT 'Lead Installer',
  color       text        DEFAULT '#6366F1',
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT NOW()
);

-- achievement_events
CREATE TABLE IF NOT EXISTS achievement_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id      uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  achievement_id   text        NOT NULL,
  xp               int         NOT NULL DEFAULT 0,
  note             text,
  awarded_by       text        DEFAULT 'system',
  awarded_at       timestamptz DEFAULT NOW()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text,
  title       text        NOT NULL,
  body        text,
  link        text,
  record_id   text,
  read        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT NOW()
);

-- Helper: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS locations_updated_at ON locations;
CREATE TRIGGER locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON appointments;
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS appointments_technician_id ON appointments(technician_id);
CREATE INDEX IF NOT EXISTS leads_org_id ON leads(org_id);
CREATE INDEX IF NOT EXISTS leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS achievement_events_employee_id ON achievement_events(employee_id);
CREATE INDEX IF NOT EXISTS notifications_profile_id ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS employees_org_id ON employees(org_id);

-- auth_org_id() helper function
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM profiles WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS (auth_org_id must exist first)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_all" ON locations;
CREATE POLICY "locations_all" ON locations FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

DROP POLICY IF EXISTS "profiles_read" ON profiles;
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (org_id = auth_org_id());
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (org_id = auth_org_id());
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (org_id = auth_org_id());

DROP POLICY IF EXISTS "profile_locations_read" ON profile_locations;
CREATE POLICY "profile_locations_read" ON profile_locations FOR SELECT USING (
  profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
);

DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

DROP POLICY IF EXISTS "leads_all" ON leads;
CREATE POLICY "leads_all" ON leads FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

DROP POLICY IF EXISTS "employees_all" ON employees;
CREATE POLICY "employees_all" ON employees FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

DROP POLICY IF EXISTS "achievement_events_all" ON achievement_events;
CREATE POLICY "achievement_events_all" ON achievement_events FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())) WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Seed default location
INSERT INTO locations (id, org_id, name, address, city, state, zip, phone, color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Main Shop',
  '123 Main St',
  'Austin',
  'TX',
  '78701',
  '512-555-0100',
  '#3B82F6'
) ON CONFLICT DO NOTHING;
