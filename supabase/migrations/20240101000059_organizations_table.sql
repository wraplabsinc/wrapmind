-- WrapOs Database Schema - Organizations Table (Issue #41)

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    plan_tier VARCHAR(20) DEFAULT 'free' CHECK (plan_tier IN ('free', 'basic', 'pro', 'enterprise')),
    trial_ends_at TIMESTAMPTZ,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    estimate_count_this_month INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_tier ON organizations(plan_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON organizations
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
