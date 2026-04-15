-- WrapOs Database Schema - Add Columns to Intake Leads Table (Issue #65)

ALTER TABLE intake_leads ADD COLUMN IF NOT EXISTS call_recording_url TEXT;
ALTER TABLE intake_leads ADD COLUMN IF NOT EXISTS call_transcription TEXT;
ALTER TABLE intake_leads ADD COLUMN IF NOT EXISTS intake_channel VARCHAR(20) DEFAULT 'web' CHECK (intake_channel IN ('web', 'phone', 'walk-in', 'email', 'social'));

CREATE INDEX IF NOT EXISTS idx_intake_leads_intake_channel ON intake_leads(intake_channel);
