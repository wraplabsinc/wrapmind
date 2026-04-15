-- WrapOs Database Schema - RLS Policy Addons and FK Constraints (Issue #39)

-- Add org_id FK to all tables that need multi-tenant RLS
-- This migration adds comprehensive FK constraints for RLS compliance

-- Add org_id to tables missing it
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_shop_settings_org_id ON shop_settings(org_id);

-- Add FK constraints to existing tables that reference org_id
-- (org_id column was added in migration 0085)

-- Ensure all org-referencing tables have proper FK constraints
-- These are safety checks for tables that may have been created without FK
DO $$
BEGIN
    -- Add FK to inventory_transactions for estimate_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_transactions_estimate_id'
    ) THEN
        ALTER TABLE inventory_transactions ADD CONSTRAINT fk_inventory_transactions_estimate_id
            FOREIGN KEY (estimate_id) REFERENCES estimates(id);
    END IF;
END $$;

-- Add composite indexes for common RLS query patterns
CREATE INDEX IF NOT EXISTS idx_estimates_org_id_status ON estimates(org_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_org_id_email ON clients(org_id, email);
CREATE INDEX IF NOT EXISTS idx_intake_leads_org_id_status ON intake_leads(org_id, status);
