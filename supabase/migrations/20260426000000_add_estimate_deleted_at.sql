-- Add soft-delete column for Estimate archive feature
-- Issue #96: Estimates status workflow
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Index for efficient "active estimates" queries (WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_estimates_deleted_at ON estimates(deleted_at) WHERE deleted_at IS NULL;
