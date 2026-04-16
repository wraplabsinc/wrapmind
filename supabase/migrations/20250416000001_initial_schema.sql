-- ============================================================
-- Phase 0: Initial Schema — app.wrapmind
-- Creates all core tables for the app with org-level RLS
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Helper function: auto-update updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        UNIQUE NOT NULL,
  settings    jsonb       DEFAULT '{}',
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT NOW(),
  updated_at  timestamptz DEFAULT NOW()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- locations
-- ─────────────────────────────────────────────
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

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- profiles (user accounts — linked to auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        UNIQUE NOT NULL, -- links to auth.users
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  full_name   text,
  role        text        DEFAULT 'estimator' CHECK (role IN ('owner', 'admin', 'manager', 'estimator', 'installer')),
  avatar_url  text,
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- profile_locations (many-to-many: team member ↔ location with per-location role)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_locations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id      uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  role_at_location text,
  is_active        boolean     DEFAULT true,
  UNIQUE(profile_id, location_id)
);

-- ─────────────────────────────────────────────
-- customers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id         uuid        REFERENCES locations(id) ON DELETE SET NULL,
  name                text        NOT NULL,
  email               text,
  phone               text,
  company             text,
  address             text,
  tags                text[]      DEFAULT '{}',
  source              text,
  referral_source_id  uuid        REFERENCES customers(id) ON DELETE SET NULL,
  assignee_id         uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  notes               text,
  status              text        DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at          timestamptz DEFAULT NOW(),
  updated_at          timestamptz DEFAULT NOW()
);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- vehicles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     uuid        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  year            int,
  make            text,
  model           text,
  trim            text,
  vin             text,
  vehicle_type    text,
  color           text,
  length_mm       int,
  width_mm        int,
  height_mm       int,
  wheelbase_mm    int,
  curb_weight_kg  decimal(10,2),
  wrap_status     text        DEFAULT 'bare' CHECK (wrap_status IN ('bare', 'wrapped', 'partial', 'scheduled')),
  wrap_color      text,
  tags            text[]      DEFAULT '{}',
  notes           text,
  last_service_at timestamptz,
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_vin_org ON vehicles(org_id, vin) WHERE vin IS NOT NULL;

-- ─────────────────────────────────────────────
-- estimates
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estimates (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id            uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  estimate_number        text        UNIQUE NOT NULL,
  customer_id            uuid        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id             uuid        REFERENCES vehicles(id) ON DELETE SET NULL,
  status                 text        DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'declined', 'expired', 'converted')),
  package                text,
  material               text,
  material_color         text,
  labor_hours            decimal(10,2),
  base_price             decimal(10,2),
  labor_cost             decimal(10,2),
  material_cost          decimal(10,2),
  discount               decimal(10,2) DEFAULT 0,
  total                  decimal(10,2),
  notes                  text,
  created_by_id          uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to_id         uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at                timestamptz,
  expires_at             timestamptz,
  approved_at            timestamptz,
  declined_at            timestamptz,
  converted_to_invoice_id uuid        REFERENCES invoices(id) ON DELETE SET NULL,
  created_at             timestamptz DEFAULT NOW(),
  updated_at             timestamptz DEFAULT NOW()
);

CREATE TRIGGER estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS estimates_org_id ON estimates(org_id);
CREATE INDEX IF NOT EXISTS estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS estimates_customer_id ON estimates(customer_id);

-- ─────────────────────────────────────────────
-- invoices
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id         uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  invoice_number      text        UNIQUE NOT NULL,
  estimate_id         uuid        REFERENCES estimates(id) ON DELETE SET NULL,
  customer_id         uuid        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id          uuid        REFERENCES vehicles(id) ON DELETE SET NULL,
  status              text        DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'voided')),
  line_items          jsonb       DEFAULT '[]',
  subtotal            decimal(10,2),
  tax_rate            decimal(5,4) DEFAULT 0.0875,
  tax_amount          decimal(10,2),
  discount            decimal(10,2) DEFAULT 0,
  total               decimal(10,2),
  amount_paid         decimal(10,2) DEFAULT 0,
  amount_due          decimal(10,2),
  payments            jsonb       DEFAULT '[]',
  terms               text,
  notes               text,
  issued_at           timestamptz,
  due_at              timestamptz,
  paid_at             timestamptz,
  voided_at           timestamptz,
  created_by_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT NOW(),
  updated_at          timestamptz DEFAULT NOW()
);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS invoices_status ON invoices(status);

-- ─────────────────────────────────────────────
-- appointments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id      uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  estimate_id      uuid        REFERENCES estimates(id) ON DELETE SET NULL,
  customer_id      uuid        REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id       uuid        REFERENCES vehicles(id) ON DELETE SET NULL,
  technician_id    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS appointments_technician_id ON appointments(technician_id);

-- ─────────────────────────────────────────────
-- leads
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id         uuid        REFERENCES locations(id) ON DELETE SET NULL,
  name                text        NOT NULL,
  phone               text,
  email               text,
  source              text,
  service_interest    text,
  budget              decimal(10,2),
  priority            text        DEFAULT 'warm' CHECK (priority IN ('hot', 'warm', 'cold')),
  status              text        DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'scheduled', 'won', 'lost')),
  assignee_id         uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  customer_id         uuid        REFERENCES customers(id) ON DELETE SET NULL,
  notes               text,
  created_at          timestamptz DEFAULT NOW(),
  updated_at          timestamptz DEFAULT NOW()
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS leads_org_id ON leads(org_id);
CREATE INDEX IF NOT EXISTS leads_status ON leads(status);

-- ─────────────────────────────────────────────
-- employees
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  name        text        NOT NULL,
  initials    text,
  role        text        DEFAULT 'Lead Installer',
  color       text        DEFAULT '#6366F1',
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- achievement_events
-- ─────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS achievement_events_employee_id ON achievement_events(employee_id);

-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS notifications_profile_id ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_read ON notifications(read);

-- ─────────────────────────────────────────────
-- RLS Policies (org-level isolation)
-- ─────────────────────────────────────────────

-- Helper to get org_id for current user
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM profiles WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- organizations: any authenticated user can see their org
CREATE POLICY "org_read" ON organizations
  FOR SELECT USING (id = auth_org_id());

-- locations
CREATE POLICY "locations_all" ON locations
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- profiles: read all org members, write only self (or admin)
CREATE POLICY "profiles_read" ON profiles
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (org_id = auth_org_id());

-- profile_locations: org members can read, but only admins write
CREATE POLICY "profile_locations_read" ON profile_locations
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
  );

-- customers
CREATE POLICY "customers_all" ON customers
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- vehicles
CREATE POLICY "vehicles_all" ON vehicles
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- estimates
CREATE POLICY "estimates_all" ON estimates
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- invoices
CREATE POLICY "invoices_all" ON invoices
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- appointments
CREATE POLICY "appointments_all" ON appointments
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- leads
CREATE POLICY "leads_all" ON leads
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- employees
CREATE POLICY "employees_all" ON employees
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- achievement_events
CREATE POLICY "achievement_events_all" ON achievement_events
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- notifications: users only see their own
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())) WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- Seed data: default org + location
-- ─────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'WrapMind Studios',
  'wrapmind',
  '{"estimatePrefix": "WM", "invoicePrefix": "INV", "taxRate": 0.0875}'
) ON CONFLICT (slug) DO NOTHING;

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
