-- WrapOs Database Schema
-- Marketing Campaigns table

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    budget NUMERIC DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('draft','active','paused','ended')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for org_id lookups
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org_id ON marketing_campaigns(org_id);

-- Enable Row Level Security
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policy: restrict access to org owner
CREATE POLICY "org_id = auth.org_id()" ON marketing_campaigns
    FOR ALL USING (org_id = auth.org_id()) WITH CHECK (org_id = auth.org_id());
