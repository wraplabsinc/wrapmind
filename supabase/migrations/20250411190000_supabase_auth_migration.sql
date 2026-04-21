-- ============================================================
-- MIGRATION: Supabase Auth + RLS Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Add auth_user_id and status to users table
-- ============================================================

-- Add auth reference column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Add user status for invite flow
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('pending', 'active'));

-- Link existing users by email (one-time backfill)
UPDATE users u
SET auth_user_id = (
SELECT id FROM auth.users WHERE email = u.email LIMIT 1
)
WHERE auth_user_id IS NULL;



-- ============================================================
-- STEP 2: Helper functions for RLS
-- ============================================================

-- Get the org_id for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
SELECT org_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get full user profile for current auth user
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS JSONB AS $$
SELECT jsonb_build_object(
'id', u.id,
'auth_user_id', u.auth_user_id,
'email', u.email,
'first_name', u.first_name,
'last_name', u.last_name,
'role', u.role,
'org_id', u.org_id,
'status', u.status
)
FROM users u
WHERE u.auth_user_id = auth.uid()
LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 3: RLS policies for all tables
-- ============================================================

-- 3a. organizations
DROP POLICY IF EXISTS "Allow all access during development" ON organizations;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_member" ON organizations FOR ALL
USING (id = get_user_org_id())
WITH CHECK (id = get_user_org_id());

-- 3b. users
DROP POLICY IF EXISTS "Allow all access during development" ON users;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Self: can read/update own row
CREATE POLICY "users_self" ON users FOR ALL
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Org members: can see other users in same org
CREATE POLICY "users_same_org" ON users FOR SELECT
USING (org_id = get_user_org_id());

-- 3c. estimates
DROP POLICY IF EXISTS "Allow all access during development" ON estimates;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estimates_org" ON estimates FOR ALL
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- 3d. clients
DROP POLICY IF EXISTS "Allow all access during development" ON clients;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_org" ON clients FOR ALL
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- 3e. intake_leads
DROP POLICY IF EXISTS "Allow all access during development" ON intake_leads;
ALTER TABLE intake_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_org" ON intake_leads FOR ALL
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- 3f. shop_settings
DROP POLICY IF EXISTS "Allow all access during development" ON shop_settings;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_settings_org" ON shop_settings FOR ALL
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- 3g. estimate_notes (access via estimates → org)
DROP POLICY IF EXISTS "Allow all access during development" ON estimate_notes;
ALTER TABLE estimate_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estimate_notes_org" ON estimate_notes FOR ALL
USING (
estimate_id IN (SELECT id FROM estimates WHERE org_id = get_user_org_id())
)
WITH CHECK (
estimate_id IN (SELECT id FROM estimates WHERE org_id = get_user_org_id())
);

-- 3h. estimate_upsells
DROP POLICY IF EXISTS "Allow all access during development" ON estimate_upsells;
ALTER TABLE estimate_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upsells_org" ON estimate_upsells FOR ALL
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- 3i. audit_log
DROP POLICY IF EXISTS "Allow all access during development" ON audit_log;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_org" ON audit_log FOR ALL
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- 3j. Reference tables (shared data — no org_id needed)
DROP POLICY IF EXISTS "Allow all access during development" ON cars;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cars_read_all" ON cars FOR SELECT USING (true);
CREATE POLICY "cars_write_all" ON cars FOR INSERT WITH CHECK (true);

DO $$
BEGIN
IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wrap_packages') THEN
DROP POLICY IF EXISTS "Allow all access during development" ON wrap_packages;
ALTER TABLE wrap_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wrap_packages_read" ON wrap_packages FOR SELECT USING (true);
END IF;
END $$;

DO $$
BEGIN
IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wrap_materials') THEN
DROP POLICY IF EXISTS "Allow all access during development" ON wrap_materials;
ALTER TABLE wrap_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wrap_materials_read" ON wrap_materials FOR SELECT USING (true);
END IF;
END $$;

-- ============================================================
-- STEP 4: Create pending user record (called by invite Edge Function)
-- NOTE: This does NOT create the auth user — use the api-invite
-- Edge Function for that. This just reserves the users row so
-- the back-link is ready when the new user verifies their email.
-- ============================================================

CREATE OR REPLACE FUNCTION create_pending_user(
p_email TEXT,
p_first_name TEXT,
p_last_name TEXT,
p_role TEXT DEFAULT 'writer',
p_auth_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
v_org_id UUID;
v_user_id UUID;
BEGIN
-- Get caller's org_id (must be owner)
SELECT org_id INTO v_org_id
FROM users
WHERE auth_user_id = auth.uid()
AND role = 'owner';

IF v_org_id IS NULL THEN
RAISE EXCEPTION 'Only owners can invite users';
END IF;

-- Check if email already registered
IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
RAISE EXCEPTION 'A user with this email already exists';
END IF;

-- Create pending user record
INSERT INTO users (auth_user_id, email, first_name, last_name, role, org_id, status)
VALUES (p_auth_user_id, p_email, p_first_name, p_last_name, p_role, v_org_id, 'pending')
RETURNING id INTO v_user_id;

RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_pending_user TO authenticated;

-- ============================================================
-- STEP 5: Link pending user once they verify their email
-- Called by the email confirmation webhook / trigger
-- ============================================================

CREATE OR REPLACE FUNCTION link_pending_user()
RETURNS TRIGGER AS $$
BEGIN
-- When a new user confirms their email in auth.users,
-- back-fill their auth_user_id into the pending users row
IF NEW.confirmed_at IS NOT NULL AND NEW.id IS NOT NULL THEN
UPDATE users
SET auth_user_id = NEW.id,
status = 'active'
WHERE email = NEW.email
AND (auth_user_id IS NULL OR auth_user_id != NEW.id)
AND status = 'pending';
END IF;
RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but do NOT re-raise — auth must never fail due to trigger errors
  RAISE NOTICE 'link_pending_user skipped: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION link_pending_user();

-- ============================================================
-- STEP 6: Backfill existing users
-- Run the ONE-TIME backfill script AFTER all existing users
-- have reset their password via "Forgot Password".
-- See: 20250411190001_backfill_existing_users.sql
-- ============================================================
