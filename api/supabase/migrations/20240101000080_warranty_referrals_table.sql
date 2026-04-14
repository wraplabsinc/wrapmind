-- WrapOs Database Schema - Warranty Referrals Table (Issue #63)

CREATE TABLE IF NOT EXISTS warranty_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    client_id UUID REFERENCES clients(id),
    partner VARCHAR(100) NOT NULL,
    clicked_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ,
    commission_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_referrals_estimate_id ON warranty_referrals(estimate_id);
CREATE INDEX IF NOT EXISTS idx_warranty_referrals_client_id ON warranty_referrals(client_id);
CREATE INDEX IF NOT EXISTS idx_warranty_referrals_partner ON warranty_referrals(partner);
CREATE INDEX IF NOT EXISTS idx_warranty_referrals_enrolled_at ON warranty_referrals(enrolled_at);

ALTER TABLE warranty_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON warranty_referrals
    FOR ALL USING (true) WITH CHECK (true);
