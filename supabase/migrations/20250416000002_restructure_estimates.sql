-- ============================================================
-- Phase 0: Fix estimates table — restructure to match app.wrapmind schema
-- Adds missing columns, renames fields, drops legacy JSONB columns
-- ============================================================

BEGIN;

-- 1. Rename estimate_id → estimate_number (preserve the naming pattern)
ALTER TABLE estimates RENAME COLUMN estimate_id TO estimate_number;

-- 2. Add missing columns (IF NOT EXISTS pattern via separate steps)
DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN assigned_to_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN sent_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN declined_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN converted_to_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN package text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN material text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN material_color text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN labor_hours numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN base_price numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN labor_cost numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN material_cost numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE estimates ADD COLUMN discount numeric(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Drop legacy JSONB columns (safe to drop — they're empty/old data)
ALTER TABLE estimates DROP COLUMN IF EXISTS vehicle_json;
ALTER TABLE estimates DROP COLUMN IF EXISTS services_json;
ALTER TABLE estimates DROP COLUMN IF EXISTS details_json;
ALTER TABLE estimates DROP COLUMN IF EXISTS vision_json;

-- 4. Drop fk constraint from client_id (old clients table, not used in new app)
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS fk_estimates_client_id;

-- 5. Update status check to include all new statuses
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_status_check;
ALTER TABLE estimates ADD CONSTRAINT estimates_status_check
  CHECK (status::text = ANY (ARRAY['draft', 'sent', 'approved', 'declined', 'expired', 'converted']));

-- 6. Ensure estimate_number is unique
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_estimate_id_key;

-- 7. Make org_id NOT NULL (it already has data, just enforcing constraint)
ALTER TABLE estimates ALTER COLUMN org_id SET NOT NULL;

-- 8. Add updated_at trigger if not present
DROP TRIGGER IF EXISTS estimates_updated_at ON estimates;
CREATE TRIGGER estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
