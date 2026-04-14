-- WrapOs Database Schema - Fleet Accounts Table (Issue #45)

-- Create fleet_accounts table
CREATE TABLE IF NOT EXISTS fleet_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(200) NOT NULL,
    billing_contact VARCHAR(255),
    rate_modifier DECIMAL(4,2) DEFAULT 1.00,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fleet_accounts_org_id ON fleet_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_fleet_accounts_name ON fleet_accounts(name);
CREATE INDEX IF NOT EXISTS idx_fleet_accounts_is_active ON fleet_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_fleet_accounts_created_at ON fleet_accounts(created_at);

-- Enable RLS
ALTER TABLE fleet_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON fleet_accounts
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_fleet_accounts_updated_at
    BEFORE UPDATE ON fleet_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
