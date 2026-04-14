-- WrapOs Database Schema - SMS Threads Table (Issue #57)

CREATE TABLE IF NOT EXISTS sms_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    client_id UUID REFERENCES clients(id),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_threads_estimate_id ON sms_threads(estimate_id);
CREATE INDEX IF NOT EXISTS idx_sms_threads_client_id ON sms_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_threads_direction ON sms_threads(direction);
CREATE INDEX IF NOT EXISTS idx_sms_threads_sent_at ON sms_threads(sent_at);

ALTER TABLE sms_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON sms_threads
    FOR ALL USING (true) WITH CHECK (true);
