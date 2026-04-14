-- Migration: Update RLS policy to allow deletes
DROP POLICY IF EXISTS "Allow all access during development" ON cars;
CREATE POLICY "Allow all access during development" ON cars
    FOR ALL USING (true) WITH CHECK (true);
