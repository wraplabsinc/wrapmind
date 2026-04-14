-- WrapOs Database Schema - Add Fields to Shop Settings Table (Issue #66)

ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS costs_json JSONB;
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS google_business_token TEXT;
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS qb_access_token TEXT;
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS xero_access_token TEXT;
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(100);
