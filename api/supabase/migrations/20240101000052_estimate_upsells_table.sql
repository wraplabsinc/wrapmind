-- WrapOs Database Schema - Estimate Upsells Table (Issue #32)

-- Create estimate_upsells table
CREATE TABLE IF NOT EXISTS estimate_upsells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    service_name VARCHAR(200) NOT NULL,
    suggested_by_ai BOOLEAN DEFAULT false,
    presented_to_client BOOLEAN DEFAULT false,
    accepted_by_client BOOLEAN DEFAULT false,
    upsell_value DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_estimate_upsells_estimate_id ON estimate_upsells(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_upsells_suggested_by_ai ON estimate_upsells(suggested_by_ai);
CREATE INDEX IF NOT EXISTS idx_estimate_upsells_accepted_by_client ON estimate_upsells(accepted_by_client);
CREATE INDEX IF NOT EXISTS idx_estimate_upsells_created_at ON estimate_upsells(created_at);

-- Enable RLS
ALTER TABLE estimate_upsells ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON estimate_upsells
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_estimate_upsells_updated_at
    BEFORE UPDATE ON estimate_upsells
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
