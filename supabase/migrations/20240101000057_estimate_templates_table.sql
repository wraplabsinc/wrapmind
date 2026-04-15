-- WrapOs Database Schema - Estimate Templates Table (Issue #37)

-- Create estimate_templates table
CREATE TABLE IF NOT EXISTS estimate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    vehicle_type VARCHAR(50),
    services_json JSONB,
    times_used INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_estimate_templates_name ON estimate_templates(name);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_vehicle_type ON estimate_templates(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_created_by ON estimate_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_is_active ON estimate_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_created_at ON estimate_templates(created_at);

-- Enable RLS
ALTER TABLE estimate_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON estimate_templates
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_estimate_templates_updated_at
    BEFORE UPDATE ON estimate_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
