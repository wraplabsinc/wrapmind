-- WrapOs Database Schema - Estimate Notes Table (Issue #38)

-- Create estimate_notes table
CREATE TABLE IF NOT EXISTS estimate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id) NOT NULL,
    body TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    is_system_event BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_estimate_notes_estimate_id ON estimate_notes(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_notes_author_id ON estimate_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_estimate_notes_is_system_event ON estimate_notes(is_system_event);
CREATE INDEX IF NOT EXISTS idx_estimate_notes_created_at ON estimate_notes(created_at);

-- Enable RLS
ALTER TABLE estimate_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON estimate_notes
    FOR ALL USING (true) WITH CHECK (true);

-- Comment noting append-only intent
COMMENT ON TABLE estimate_notes IS 'Append-only internal notes thread per estimate — do not allow UPDATE or DELETE';
