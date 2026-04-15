-- WrapOs Database Schema - Estimates Table (Issue #28)

-- Create estimates table
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id VARCHAR(20) NOT NULL,
    version INT DEFAULT 1,
    client_id UUID,
    vehicle_json JSONB,
    services_json JSONB,
    details_json JSONB,
    vision_json JSONB,
    line_items_json JSONB,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'booked', 'archived')),
    shopmonkey_order_id VARCHAR(50),
    shopmonkey_order_url TEXT,
    signature_data TEXT,
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    confidence_score DECIMAL(5,2),
    confidence_tier VARCHAR(10) CHECK (confidence_tier IN ('high', 'moderate', 'low')),
    confidence_factors_json JSONB,
    confidence_improved_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_estimates_estimate_id ON estimates(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_created_by ON estimates(created_by);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);
CREATE INDEX IF NOT EXISTS idx_estimates_expires_at ON estimates(expires_at);

-- Enable RLS
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON estimates
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
