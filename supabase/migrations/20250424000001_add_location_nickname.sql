-- Add nickname column to locations table (used by Settings > Location Management)
ALTER TABLE IF EXISTS locations
  ADD COLUMN IF NOT EXISTS nickname text;
