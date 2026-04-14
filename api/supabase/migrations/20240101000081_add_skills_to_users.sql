-- WrapOs Database Schema - Add Skills to Users Table (Issue #64)

ALTER TABLE users ADD COLUMN IF NOT EXISTS skills_json JSONB DEFAULT '[]'::jsonb;
