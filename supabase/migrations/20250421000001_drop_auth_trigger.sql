-- TEMP: Drop the auth trigger to test if it's causing admin user creation failures
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP FUNCTION IF EXISTS link_pending_user();
