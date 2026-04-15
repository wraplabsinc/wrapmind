-- WrapOs Database Schema - Revenue Target PCT Table (Issue #56)

CREATE TABLE IF NOT EXISTS revenue_target_pct (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    target_date DATE NOT NULL,
    target_pct DECIMAL(5,2) NOT NULL,
    actual_pct DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_target_pct_org_id ON revenue_target_pct(org_id);
CREATE INDEX IF NOT EXISTS idx_revenue_target_pct_target_date ON revenue_target_pct(target_date);

ALTER TABLE revenue_target_pct ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON revenue_target_pct
    FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_revenue_target_pct_updated_at
    BEFORE UPDATE ON revenue_target_pct
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
