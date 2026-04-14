-- WrapOs Database Schema - Intake Leads Table (Issue #33)

-- Create intake_leads table
CREATE TABLE IF NOT EXISTS intake_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    vehicle_year INTEGER,
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_color VARCHAR(50),
    services_requested JSONB,
    photos_json JSONB,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'dismissed')),
    notes TEXT,
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_intake_leads_email ON intake_leads(email);
CREATE INDEX IF NOT EXISTS idx_intake_leads_phone ON intake_leads(phone);
CREATE INDEX IF NOT EXISTS idx_intake_leads_status ON intake_leads(status);
CREATE INDEX IF NOT EXISTS idx_intake_leads_assigned_to ON intake_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_intake_leads_created_at ON intake_leads(created_at);

-- Enable RLS
ALTER TABLE intake_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON intake_leads
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_intake_leads_updated_at
    BEFORE UPDATE ON intake_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
