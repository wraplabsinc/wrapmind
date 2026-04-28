-- Add soft-delete column for Invoice archive feature
-- Issue #97: Invoices CRUD + status transitions (archive via soft-delete)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Index for efficient "active invoices" queries (WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;
