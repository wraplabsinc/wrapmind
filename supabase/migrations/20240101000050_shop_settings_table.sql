-- WrapOs Database Schema - Shop Settings Table (Issue #30)

-- Create shop_settings table
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    labor_rate_general DECIMAL(6,2) DEFAULT 125.00,
    labor_rate_ppf DECIMAL(6,2) DEFAULT 195.00,
    shop_supplies_pct DECIMAL(4,2) DEFAULT 5.00,
    cc_fee_pct DECIMAL(4,2) DEFAULT 3.50,
    tax_rate DECIMAL(4,2) DEFAULT 7.25,
    deposit_pct DECIMAL(4,2) DEFAULT 50.00,
    quote_expiry_days INT DEFAULT 14,
    rush_multiplier DECIMAL(4,2) DEFAULT 1.20,
    estimate_id_prefix VARCHAR(10) DEFAULT 'WL',
    shopmonkey_bearer_token TEXT,
    shopmonkey_default_status VARCHAR(100),
    shopmonkey_default_writer VARCHAR(100),
    sm_last_synced_at TIMESTAMPTZ,
    film_prefs_json JSONB,
    payment_links_json JSONB,
    margin_pin VARCHAR(6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_name ON shop_settings(shop_name);

-- Enable RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON shop_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_shop_settings_updated_at
    BEFORE UPDATE ON shop_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment noting this is intended to be a single-row table
COMMENT ON TABLE shop_settings IS 'Single row per shop — use INSERT ... ON CONFLICT or enforce single row via application logic';
