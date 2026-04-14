-- WrapOs Database Schema - Photo Timeline Table (Issue #43)

-- Create photo_timeline table
CREATE TABLE IF NOT EXISTS photo_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    stage VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_photo_timeline_estimate_id ON photo_timeline(estimate_id);
CREATE INDEX IF NOT EXISTS idx_photo_timeline_stage ON photo_timeline(stage);
CREATE INDEX IF NOT EXISTS idx_photo_timeline_uploaded_by ON photo_timeline(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photo_timeline_created_at ON photo_timeline(created_at);

-- Enable RLS
ALTER TABLE photo_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON photo_timeline
    FOR ALL USING (true) WITH CHECK (true);
