-- Migration: Fill remaining cars with generic vehicle_type dimensions

-- Step 2: Update remaining cars with generic vehicle_type dimensions
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm,
    curb_weight_kg = d.curb_weight_kg
FROM (
    SELECT DISTINCT ON (vehicle_type)
        vehicle_type,
        length_mm,
        width_mm,
        height_mm,
        wheelbase_mm,
        ground_clearance_mm,
        curb_weight_kg
    FROM dimension_references
    WHERE make IS NULL AND vehicle_type IS NOT NULL
) d
WHERE c.vehicle_type = d.vehicle_type
    AND c.length_mm IS NULL;

-- Count updated
DO $$
DECLARE
    v_total INTEGER;
    v_with_dims INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM cars;
    SELECT COUNT(*) INTO v_with_dims FROM cars WHERE length_mm IS NOT NULL;
    RAISE NOTICE 'Total cars: %. Cars with dimensions: %', v_total, v_with_dims;
END $$;