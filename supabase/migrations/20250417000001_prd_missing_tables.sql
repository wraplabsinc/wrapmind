-- ============================================================
-- Phase 1: PRD Missing Tables — app.wrapmind
-- Issue #33: Create missing tables from PRD
-- Sections: 3.13 (audit_log), 3.14 (location_settings), 3.15 (permissions),
--            3.16 (marketing), 3.17 (organization_settings), 3.18 (reference data)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Helper: auto-update updated_at (reused from initial schema)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- 3.13 audit_log
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid        REFERENCES locations(id),
  actor_id    uuid        REFERENCES profiles(id),
  actor_role  text,
  actor_label text,
  action      text        NOT NULL,
  severity    text        DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  target      text,
  target_id   uuid,
  details     jsonb,
  created_at  timestamptz DEFAULT NOW()
);

CREATE TRIGGER audit_log_created_at
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS audit_log_org_id ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS audit_log_target_id ON audit_log(target_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at ON audit_log(created_at);

-- ─────────────────────────────────────────────
-- 3.15 permissions (data-driven RLS)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'estimator', 'installer')),
  resource   text        NOT NULL,
  action     text        NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(org_id, role, resource, action)
);

CREATE INDEX IF NOT EXISTS permissions_org_id ON permissions(org_id);
CREATE INDEX IF NOT EXISTS permissions_role ON permissions(role);

-- ─────────────────────────────────────────────
-- 3.14 location_settings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_settings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id      uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  shop_name        text,
  shop_hours       jsonb       DEFAULT '{}',
  default_tax_rate decimal(5,4) DEFAULT 0.0875,
  platform_settings jsonb      DEFAULT '{}',
  created_at       timestamptz DEFAULT NOW(),
  updated_at       timestamptz DEFAULT NOW()
);

CREATE TRIGGER location_settings_updated_at
  BEFORE UPDATE ON location_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS location_settings_location_id ON location_settings(location_id);

-- ─────────────────────────────────────────────
-- 3.17 organization_settings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_settings (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  default_service_durations jsonb      DEFAULT '[]',
  default_packages         jsonb        DEFAULT '[]',
  default_modifiers        jsonb        DEFAULT '[]',
  config                   jsonb        DEFAULT '{}',
  created_at               timestamptz  DEFAULT NOW(),
  updated_at               timestamptz  DEFAULT NOW()
);

CREATE TRIGGER organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_org_id ON organization_settings(org_id);

-- ─────────────────────────────────────────────
-- 3.18 Reference Data Tables (Location-scoped)
-- ─────────────────────────────────────────────

-- wrap_packages
CREATE TABLE IF NOT EXISTS wrap_packages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  base_price    decimal(10,2) NOT NULL,
  labor_hours   decimal(10,2) NOT NULL,
  labor_cost    decimal(10,2),
  material_cost decimal(10,2),
  is_active     boolean     DEFAULT true,
  created_at    timestamptz DEFAULT NOW(),
  updated_at    timestamptz DEFAULT NOW()
);

CREATE TRIGGER wrap_packages_updated_at
  BEFORE UPDATE ON wrap_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS wrap_packages_location_id ON wrap_packages(location_id);
CREATE INDEX IF NOT EXISTS wrap_packages_is_active ON wrap_packages(is_active);

-- modifiers
CREATE TABLE IF NOT EXISTS modifiers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  price       decimal(10,2) NOT NULL,
  unit        text        DEFAULT 'unit' CHECK (unit IN ('unit', 'sqft', 'hour')),
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT NOW(),
  updated_at  timestamptz DEFAULT NOW()
);

CREATE TRIGGER modifiers_updated_at
  BEFORE UPDATE ON modifiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS modifiers_location_id ON modifiers(location_id);
CREATE INDEX IF NOT EXISTS modifiers_is_active ON modifiers(is_active);

-- service_durations
CREATE TABLE IF NOT EXISTS service_durations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_type    text        NOT NULL,
  duration_minutes int        NOT NULL,
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);

CREATE TRIGGER service_durations_updated_at
  BEFORE UPDATE ON service_durations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS service_durations_location_service ON service_durations(location_id, service_type);

-- ─────────────────────────────────────────────
-- 3.16 Marketing Tables
-- ─────────────────────────────────────────────

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id  uuid        NOT NULL REFERENCES locations(id),
  source       text,
  rating       int         CHECK (rating >= 1 AND rating <= 5),
  body         text,
  customer_name text,
  responded    boolean     DEFAULT false,
  created_at   timestamptz DEFAULT NOW(),
  deleted_at   timestamptz
);

CREATE INDEX IF NOT EXISTS reviews_org_id ON reviews(org_id);
CREATE INDEX IF NOT EXISTS reviews_location_id ON reviews(location_id);
CREATE INDEX IF NOT EXISTS reviews_deleted_at ON reviews(deleted_at) WHERE deleted_at IS NULL;

-- campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid        NOT NULL REFERENCES locations(id),
  name        text        NOT NULL,
  channel     text        CHECK (channel IN ('email', 'sms', 'social')),
  status      text        DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  budget      decimal(10,2),
  start_date  date,
  end_date    date,
  created_at  timestamptz DEFAULT NOW(),
  updated_at  timestamptz DEFAULT NOW(),
  deleted_at  timestamptz
);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS campaigns_org_id ON campaigns(org_id);
CREATE INDEX IF NOT EXISTS campaigns_status ON campaigns(status);

-- follow_ups
CREATE TABLE IF NOT EXISTS follow_ups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid       NOT NULL REFERENCES locations(id),
  name       text,
  type       text        CHECK (type IN ('email', 'sms')),
  template   text,
  delay_days int         DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS follow_ups_org_id ON follow_ups(org_id);
CREATE INDEX IF NOT EXISTS follow_ups_deleted_at ON follow_ups(deleted_at) WHERE deleted_at IS NULL;

-- referrals
CREATE TABLE IF NOT EXISTS referrals (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id           uuid        NOT NULL REFERENCES locations(id),
  customer_id           uuid        REFERENCES customers(id) ON DELETE SET NULL,
  referred_name         text,
  referred_phone        text,
  referred_email        text,
  status                text        DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  converted_to_customer_id uuid    REFERENCES customers(id) ON DELETE SET NULL,
  created_at            timestamptz DEFAULT NOW(),
  deleted_at            timestamptz
);

CREATE INDEX IF NOT EXISTS referrals_org_id ON referrals(org_id);
CREATE INDEX IF NOT EXISTS referrals_customer_id ON referrals(customer_id);
CREATE INDEX IF NOT EXISTS referrals_status ON referrals(status);

-- gallery_images
CREATE TABLE IF NOT EXISTS gallery_images (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid        NOT NULL REFERENCES locations(id),
  url         text        NOT NULL,
  caption     text,
  featured    boolean     DEFAULT false,
  tags        text[]      DEFAULT '{}',
  created_at  timestamptz DEFAULT NOW(),
  deleted_at  timestamptz
);

CREATE INDEX IF NOT EXISTS gallery_images_org_id ON gallery_images(org_id);
CREATE INDEX IF NOT EXISTS gallery_images_location_id ON gallery_images(location_id);
CREATE INDEX IF NOT EXISTS gallery_images_featured ON gallery_images(featured) WHERE featured = true;

-- ─────────────────────────────────────────────
-- RLS Policies for all new tables
-- ─────────────────────────────────────────────

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrap_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- audit_log: org members can read; write restricted to system/automated
CREATE POLICY "audit_log_read" ON audit_log
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (org_id = auth_org_id());

-- permissions: org members can read; only owner can write
CREATE POLICY "permissions_read" ON permissions
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "permissions_write" ON permissions
  FOR ALL USING (org_id = auth_org_id());

-- location_settings: org members can read; admin/owner can write
CREATE POLICY "location_settings_read" ON location_settings
  FOR SELECT USING (
    location_id IN (
      SELECT location_id FROM profile_locations
      WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
    )
  );
CREATE POLICY "location_settings_write" ON location_settings
  FOR ALL USING (location_id IN (
    SELECT location_id FROM profile_locations
    WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
  ));

-- organization_settings: org members can read; owner can write
CREATE POLICY "organization_settings_read" ON organization_settings
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "organization_settings_write" ON organization_settings
  FOR ALL USING (org_id = auth_org_id());

-- wrap_packages: org members can read; manager/owner can write
CREATE POLICY "wrap_packages_read" ON wrap_packages
  FOR SELECT USING (
    location_id IN (
      SELECT location_id FROM profile_locations
      WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
    )
  );
CREATE POLICY "wrap_packages_write" ON wrap_packages
  FOR ALL USING (location_id IN (
    SELECT location_id FROM profile_locations
    WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
  ));

-- modifiers: same as wrap_packages
CREATE POLICY "modifiers_read" ON modifiers
  FOR SELECT USING (
    location_id IN (
      SELECT location_id FROM profile_locations
      WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
    )
  );
CREATE POLICY "modifiers_write" ON modifiers
  FOR ALL USING (location_id IN (
    SELECT location_id FROM profile_locations
    WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
  ));

-- service_durations: same pattern
CREATE POLICY "service_durations_read" ON service_durations
  FOR SELECT USING (
    location_id IN (
      SELECT location_id FROM profile_locations
      WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
    )
  );
CREATE POLICY "service_durations_write" ON service_durations
  FOR ALL USING (location_id IN (
    SELECT location_id FROM profile_locations
    WHERE profile_id IN (SELECT id FROM profiles WHERE org_id = auth_org_id())
  ));

-- reviews: org members can read/write
CREATE POLICY "reviews_all" ON reviews
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- campaigns: org members can read/write
CREATE POLICY "campaigns_all" ON campaigns
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- follow_ups: org members can read/write
CREATE POLICY "follow_ups_all" ON follow_ups
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- referrals: org members can read/write
CREATE POLICY "referrals_all" ON referrals
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- gallery_images: org members can read/write
CREATE POLICY "gallery_images_all" ON gallery_images
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());
