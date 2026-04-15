-- WrapOs Database Schema - Bays Table (Issue #59)

CREATE TABLE IF NOT EXISTS bays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bays_org_id ON bays(org_id);
CREATE INDEX IF NOT EXISTS idx_bays_is_active ON bays(is_active);

ALTER TABLE bays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON bays
    FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_bays_updated_at
    BEFORE UPDATE ON bays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
