-- WrapOs Database Schema - Estimate Versions Table (Issue #47)

-- Create estimate_versions table
CREATE TABLE IF NOT EXISTS estimate_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    version INT NOT NULL,
    snapshot_json JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_estimate_versions_estimate_id ON estimate_versions(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_versions_version ON estimate_versions(version);
CREATE INDEX IF NOT EXISTS idx_estimate_versions_created_by ON estimate_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_estimate_versions_created_at ON estimate_versions(created_at);

-- Enable RLS
ALTER TABLE estimate_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON estimate_versions
    FOR ALL USING (true) WITH CHECK (true);
