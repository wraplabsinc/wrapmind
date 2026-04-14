-- WrapOs Database Schema - Labor Logs Table (Issue #51)

CREATE TABLE IF NOT EXISTS labor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    user_id UUID REFERENCES users(id),
    start_at TIMESTAMPTZ NOT NULL,
    stop_at TIMESTAMPTZ,
    actual_hours DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labor_logs_estimate_id ON labor_logs(estimate_id);
CREATE INDEX IF NOT EXISTS idx_labor_logs_user_id ON labor_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_labor_logs_start_at ON labor_logs(start_at);
CREATE INDEX IF NOT EXISTS idx_labor_logs_created_at ON labor_logs(created_at);

ALTER TABLE labor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON labor_logs
    FOR ALL USING (true) WITH CHECK (true);
