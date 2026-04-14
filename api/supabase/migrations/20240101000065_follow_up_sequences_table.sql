-- WrapOs Database Schema - Follow Up Sequences Table (Issue #48)

-- Create follow_up_sequences table
CREATE TABLE IF NOT EXISTS follow_up_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    trigger_event VARCHAR(100) NOT NULL,
    delay_days INT DEFAULT 0,
    channel VARCHAR(20) NOT NULL,
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_org_id ON follow_up_sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_trigger_event ON follow_up_sequences(trigger_event);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_channel ON follow_up_sequences(channel);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_is_active ON follow_up_sequences(is_active);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_created_at ON follow_up_sequences(created_at);

-- Enable RLS
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON follow_up_sequences
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_follow_up_sequences_updated_at
    BEFORE UPDATE ON follow_up_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
