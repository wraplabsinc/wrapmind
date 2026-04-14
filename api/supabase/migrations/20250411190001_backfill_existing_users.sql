-- ============================================================
-- ONE-TIME BACKFILL: Link existing users to auth.users
-- Run this ONCE after all existing users have:
--   1. Logged in via Supabase Auth (they will have reset password)
--   2. Confirmed their email
--
-- This script:
--   - Matches users with no auth_user_id to auth.users by email
--   - Marks them as 'active'
--   - Marks users with no auth match as 'orphaned' (no Supabase account yet)
-- ============================================================

-- Link users that have a matching auth.users account
UPDATE users
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = users.email LIMIT 1
),
status = 'active'
WHERE auth_user_id IS NULL
AND EXISTS (SELECT 1 FROM auth.users WHERE email = users.email);

-- Mark users with no auth match (still on old password_hash, no Supabase account)
-- They should use "Forgot Password" to create their Supabase account
-- Note: This requires the status constraint to allow 'orphaned' - handled separately

-- Verify the link worked
SELECT
  count(*) as total_users,
  count(auth_user_id) as linked_users,
  count(*) FILTER (WHERE auth_user_id IS NULL) as unlinked_users,
  count(*) FILTER (WHERE status = 'orphaned') as orphaned_users
FROM users;
