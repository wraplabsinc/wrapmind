-- Add 'archived' to estimates.status enum
-- This matches the EstimatesPage.jsx STATUS_CONFIG which includes 'archived'
-- Fixes archive button calling updateEstimate(id, { status: 'archived' })

ALTER TABLE estimates 
  DROP CONSTRAINT IF EXISTS estimates_status_check,
  ADD CONSTRAINT estimates_status_check
  CHECK (status::text = ANY (ARRAY['draft','sent','approved','declined','expired','converted','archived']));
