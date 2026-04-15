-- Migration: Direct update using dimension_references with efficient join

-- This is more efficient than the function because it doesn't use pattern matching
-- for cars that already have valid dimensions from specific makes
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm,
    curb_weight_kg = d.curb_weight_kg
FROM dimension_references d
WHERE d.make = c.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL
    AND (
        c.length_mm IS NULL OR 
        c.length_mm IN (SELECT length_mm FROM dimension_references WHERE make IS NULL AND vehicle_type = c.vehicle_type LIMIT 1)
    );

DO $$
DECLARE
    v_total INTEGER;
    v_updated INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM cars;
    SELECT COUNT(*) INTO v_updated FROM cars WHERE 
        length_mm IN (SELECT length_mm FROM dimension_references WHERE make IS NOT NULL);
    RAISE NOTICE 'Total cars: %. Cars with specific dimensions: %', v_total, v_updated;
END $$;