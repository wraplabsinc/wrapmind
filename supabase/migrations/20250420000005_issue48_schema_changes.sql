-- ============================================================
-- Issue #48: Phase 2 schema changes
-- ShopMonkey Import Pipeline
-- ============================================================
-- Already applied via Management API. This file is for repo
-- documentation only.
-- ============================================================

-- 1. invoices table (did not exist in prod)
-- CREATE TABLE invoices (...);

-- 2. Add unique indexes for shopmonkey_order_id (enables upsert ON CONFLICT)
-- CREATE UNIQUE INDEX IF NOT EXISTS estimates_shopmonkey_order_id
--   ON estimates(org_id, shopmonkey_order_id) WHERE shopmonkey_order_id IS NOT NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS invoices_shopmonkey_order_id
--   ON invoices(org_id, shopmonkey_order_id) WHERE shopmonkey_order_id IS NOT NULL;

-- 3. Widen estimate_id and invoice_number to varchar(64) to fit 'SM-{uuid}'
-- ALTER TABLE estimates ALTER COLUMN estimate_id TYPE varchar(64);
-- ALTER TABLE invoices ALTER COLUMN invoice_number TYPE varchar(64);
