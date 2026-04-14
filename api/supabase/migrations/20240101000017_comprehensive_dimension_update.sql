-- Migration: Update all cars with dimension references using efficient batch approach
-- This handles all makes and models in a single efficient query

-- Update using dimension_references with pattern matching for all makes
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
    AND d.make IS NOT NULL;

-- Summary
DO $$
DECLARE
    v_updated INTEGER;
    v_total INTEGER;
    v_with_dims INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM cars;
    SELECT COUNT(*) INTO v_with_dims FROM cars WHERE length_mm IS NOT NULL;
    v_updated := v_with_dims;
    RAISE NOTICE 'Total cars: %. Updated: %', v_total, v_updated;
END $$;