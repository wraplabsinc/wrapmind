-- ============================================================
-- Issue #44: Create vehicles table with sm_vehicle_id
-- ShopMonkey Import Pipeline — P0 Critical Path
-- ============================================================
-- The prod schema has:
--   clients  = customers (already has shopmonkey_customer_id + index)
--   cars     = vehicle make/model/trim lookup (dimension reference)
--   vehicles = MISSING (customer vehicles — needs to be created)
--
-- This migration:
--   1. Creates the vehicles table (client_id → clients, car_id → cars)
--   2. Adds sm_vehicle_id for Phase 2 join to sm_import_vehicles
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Helper: auto-update updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- vehicles: customer vehicles (not the cars lookup table)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  car_id          uuid        REFERENCES cars(id) ON DELETE SET NULL,  -- optional link to specs lookup

  -- ShopMonkey external ID (for Phase 2 join to sm_import_vehicles)
  sm_vehicle_id   text,

  -- Vehicle fields (mirrors sm_import_vehicles + cars lookup)
  year            int,
  make            text,
  model           text,
  trim            text,
  vin             text,
  color           text,
  license_plate   text,
  vehicle_type    text,

  -- Wrap-specific
  wrap_status     text        DEFAULT 'bare' CHECK (wrap_status IN ('bare', 'wrapped', 'partial', 'scheduled')),
  wrap_color      text,
  notes           text,
  last_service_at timestamptz,

  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
-- Unique: one sm_vehicle_id per org (NULLs excluded)
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_org_sm_vehicle_id
  ON vehicles(org_id, sm_vehicle_id)
  WHERE sm_vehicle_id IS NOT NULL;

-- Unique: one VIN per org
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_org_vin
  ON vehicles(org_id, vin)
  WHERE vin IS NOT NULL;

-- FK lookups
CREATE INDEX IF NOT EXISTS vehicles_client_id   ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS vehicles_car_id       ON vehicles(car_id) WHERE car_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vehicles_org_id       ON vehicles(org_id);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: org members can do everything within their org
CREATE POLICY "vehicles_all" ON vehicles
  FOR ALL USING (org_id = get_user_org_id()) WITH CHECK (org_id = get_user_org_id());
