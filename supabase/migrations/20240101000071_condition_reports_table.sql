-- WrapOs Database Schema - Condition Reports Table (Issue #54)

CREATE TABLE IF NOT EXISTS condition_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    diagram_json JSONB,
    signature_data TEXT,
    signed_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_condition_reports_estimate_id ON condition_reports(estimate_id);
CREATE INDEX IF NOT EXISTS idx_condition_reports_signed_at ON condition_reports(signed_at);

ALTER TABLE condition_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON condition_reports
    FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_condition_reports_updated_at
    BEFORE UPDATE ON condition_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
