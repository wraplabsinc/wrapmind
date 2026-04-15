-- WrapOs Database Schema - Feedback Log Table (Issue #62)

CREATE TABLE IF NOT EXISTS feedback_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    feature VARCHAR(100) NOT NULL,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_log_org_id ON feedback_log(org_id);
CREATE INDEX IF NOT EXISTS idx_feedback_log_user_id ON feedback_log(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_log_feature ON feedback_log(feature);
CREATE INDEX IF NOT EXISTS idx_feedback_log_sentiment ON feedback_log(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_log_created_at ON feedback_log(created_at);

ALTER TABLE feedback_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON feedback_log
    FOR ALL USING (true) WITH CHECK (true);
