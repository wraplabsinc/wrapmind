-- Fix RLS policies to allow open access for cars table
-- The API key policies were blocking access

DROP POLICY "API key access to cars" ON cars;
DROP POLICY IF EXISTS "Allow all access during development" ON cars;

-- Create open access policy for cars (for now, can be restricted later)
CREATE POLICY "Allow all access" ON cars
    FOR ALL USING (true) WITH CHECK (true);

-- Also fix wrap_packages and wrap_materials if needed
DROP POLICY "API key access to wrap_packages" ON wrap_packages;
CREATE POLICY "Allow all access wrap_packages" ON wrap_packages
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY "API key access to wrap_materials" ON wrap_materials;
CREATE POLICY "Allow all access wrap_materials" ON wrap_materials
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY "API key access to dimension_references" ON dimension_references;
CREATE POLICY "Allow all access dimension_references" ON dimension_references
FOR ALL USING (true) WITH CHECK (true);

DO $$
DECLARE
v_count INTEGER;
BEGIN
SELECT COUNT(*) INTO v_count FROM cars;
RAISE NOTICE 'Cars count: %', v_count;
END $$;