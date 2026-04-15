-- WrapOs Database Schema - Referrals Table (Issue #61)

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_org_id UUID REFERENCES organizations(id),
    referred_org_id UUID REFERENCES organizations(id),
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    activated_at TIMESTAMPTZ,
    credit_applied DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_org_id ON referrals(referrer_org_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_org_id ON referrals(referred_org_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON referrals
    FOR ALL USING (true) WITH CHECK (true);
