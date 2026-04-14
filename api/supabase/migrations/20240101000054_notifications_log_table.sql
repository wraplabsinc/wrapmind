-- WrapOs Database Schema - Notifications Log Table (Issue #34)

-- Create notifications_log table
CREATE TABLE IF NOT EXISTS notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    channel VARCHAR(20) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    recipient VARCHAR(255),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    metadata_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_log_estimate_id ON notifications_log(estimate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_channel ON notifications_log(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_log_trigger_event ON notifications_log(trigger_event);
CREATE INDEX IF NOT EXISTS idx_notifications_log_sent_at ON notifications_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_log_created_at ON notifications_log(created_at);

-- Enable RLS
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON notifications_log
    FOR ALL USING (true) WITH CHECK (true);
