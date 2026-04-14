-- WrapOs Database Schema - Follow Up Log Table (Issue #49)

-- Create follow_up_log table
CREATE TABLE IF NOT EXISTS follow_up_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES follow_up_sequences(id),
    estimate_id UUID REFERENCES estimates(id),
    client_id UUID REFERENCES clients(id),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_follow_up_log_sequence_id ON follow_up_log(sequence_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_log_estimate_id ON follow_up_log(estimate_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_log_client_id ON follow_up_log(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_log_sent_at ON follow_up_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_follow_up_log_created_at ON follow_up_log(created_at);

-- Enable RLS
ALTER TABLE follow_up_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON follow_up_log
    FOR ALL USING (true) WITH CHECK (true);
