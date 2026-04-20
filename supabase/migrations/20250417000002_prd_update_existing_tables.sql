-- ============================================================
-- Phase 2: Update Existing Tables — app.wrapmind
-- Issue #34: Add missing columns per PRD spec
-- ============================================================

-- ─────────────────────────────────────────────
-- customers: Add DISC personality columns
-- ─────────────────────────────────────────────
ALTER TABLE customers ADD COLUMN IF NOT EXISTS disc_type text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS disc_scores jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS disc_signals jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS communication_style text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS closing_tips text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS personality_confidence numeric;

-- ─────────────────────────────────────────────
-- vehicles: Add location_id and lead_id
-- ─────────────────────────────────────────────
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id);

-- Add index for location_id on vehicles
CREATE INDEX IF NOT EXISTS vehicles_location_id ON vehicles(location_id);

-- Backfill location_id from customers for existing records
UPDATE vehicles v SET location_id = c.location_id
FROM customers c
WHERE v.customer_id = c.id AND v.location_id IS NULL;

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id);

CREATE INDEX IF NOT EXISTS vehicles_lead_id ON vehicles(lead_id) WHERE lead_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- estimates: Add modifier_selections
-- ─────────────────────────────────────────────
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS modifier_selections jsonb DEFAULT '[]';

-- ─────────────────────────────────────────────
-- leads: Add location_id (NOT NULL), vehicle fields, follow_up_date
-- ─────────────────────────────────────────────

-- First make location_id NOT NULL (it's currently nullable)
-- This requires that all existing leads have a location_id
-- We'll backfill from the customer's location
UPDATE leads l SET location_id = c.location_id
FROM customers c
WHERE l.customer_id = c.id AND l.location_id IS NULL;

-- Set a default location for any leads still without one (shouldn't happen but safety)
UPDATE leads SET location_id = (
  SELECT location_id FROM locations WHERE org_id = leads.org_id LIMIT 1
) WHERE location_id IS NULL;

-- Now set to NOT NULL
ALTER TABLE leads ALTER COLUMN location_id SET NOT NULL;

-- Add vehicle fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_year int;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_make text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_vin text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_color text;

-- Add follow_up_date
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date date;

-- ─────────────────────────────────────────────
-- estimate_templates: Migrate to PRD schema
-- ─────────────────────────────────────────────

-- The existing estimate_templates table (from 20240101000057) has wrong schema.
-- PRD requires: id, org_id, location_id, name, package, modifier_selections,
--               material, material_color, base_price, created_by_id, created_at, updated_at
--
-- We need to:
-- 1. Rename old table to backup
-- 2. Create new table with correct schema
-- 3. (No data migration needed — templates were development-only)

ALTER TABLE estimate_templates RENAME TO estimate_templates_old;

CREATE TABLE IF NOT EXISTS estimate_templates (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id        uuid        NOT NULL REFERENCES locations(id),
  name               text        NOT NULL,
  package            text,
  modifier_selections jsonb       DEFAULT '[]',
  material           text,
  material_color     text,
  base_price         decimal(10,2),
  created_by_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         timestamptz DEFAULT NOW(),
  updated_at         timestamptz DEFAULT NOW()
);

CREATE TRIGGER estimate_templates_updated_at
  BEFORE UPDATE ON estimate_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS estimate_templates_org_id ON estimate_templates(org_id);
CREATE INDEX IF NOT EXISTS estimate_templates_location_id ON estimate_templates(location_id);

-- Enable RLS
ALTER TABLE estimate_templates ENABLE ROW LEVEL SECURITY;

-- RLS policy: users see templates in their org
CREATE POLICY "estimate_templates_read" ON estimate_templates
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "estimate_templates_write" ON estimate_templates
  FOR ALL USING (org_id = auth_org_id()) WITH CHECK (org_id = auth_org_id());

-- Note: estimate_templates_old is kept as a backup but is not accessible via RLS
-- It can be dropped after verifying no application code references it
