-- Migration: Update wheelbase for all cars from dimension_references

-- Update wheelbase for all cars based on make/model/year match
UPDATE cars c
SET wheelbase_mm = d.wheelbase_mm
FROM dimension_references d
WHERE d.make = c.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL
    AND d.wheelbase_mm IS NOT NULL;

-- Also update remaining cars using generic vehicle_type wheelbase
UPDATE cars c
SET wheelbase_mm = d.wheelbase_mm
FROM (
    SELECT DISTINCT ON (vehicle_type)
        vehicle_type,
        wheelbase_mm
    FROM dimension_references
    WHERE make IS NULL AND wheelbase_mm IS NOT NULL
) d
WHERE c.vehicle_type = d.vehicle_type
    AND c.wheelbase_mm IS NULL;

-- Summary
DO $$
DECLARE
    v_total INTEGER;
    v_with_wb INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM cars;
    SELECT COUNT(*) INTO v_with_wb FROM cars WHERE wheelbase_mm IS NOT NULL;
    RAISE NOTICE 'Total: %. With wheelbase: % (%.1f%%)', 
        v_total, v_with_wb, CASE WHEN v_total > 0 THEN (v_with_wb * 100.0 / v_total) ELSE 0 END;
END $$;