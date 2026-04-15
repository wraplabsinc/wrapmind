-- WrapOs Database Schema - Job Tracker Tokens Table (Issue #44)

-- Create job_tracker_tokens table
CREATE TABLE IF NOT EXISTS job_tracker_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_tracker_tokens_estimate_id ON job_tracker_tokens(estimate_id);
CREATE INDEX IF NOT EXISTS idx_job_tracker_tokens_token ON job_tracker_tokens(token);
CREATE INDEX IF NOT EXISTS idx_job_tracker_tokens_created_at ON job_tracker_tokens(created_at);

-- Enable RLS
ALTER TABLE job_tracker_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON job_tracker_tokens
    FOR ALL USING (true) WITH CHECK (true);
