-- WrapOs Database Schema - Billing Events Table (Issue #42)

CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    event_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    estimate_id UUID REFERENCES estimates(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_org_id ON billing_events(org_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_estimate_id ON billing_events(estimate_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON billing_events
    FOR ALL USING (true) WITH CHECK (true);
