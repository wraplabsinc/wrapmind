-- Migration: Update remaining cars with correct dimensions based on year-specific references
-- This ensures older model years get correct dimensions even if they have generic dimensions

-- First, update cars that have generic dimensions (from previous incorrect updates)
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
    -- Only update if current dimensions don't match a make-specific reference
    AND NOT EXISTS (
        SELECT 1 FROM dimension_references d2 
        WHERE d2.make = c.make 
            AND c.model LIKE d2.model || '%'
            AND c.year BETWEEN d2.year_start AND d2.year_end
            AND d2.make IS NOT NULL
            AND d2.length_mm = c.length_mm
    );

-- Summary
DO $$
DECLARE
    v_total INTEGER;
    v_updated INTEGER;
    v_specific INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM cars;
    SELECT COUNT(*) INTO v_updated FROM cars;
    SELECT COUNT(*) INTO v_specific FROM cars c WHERE EXISTS (
        SELECT 1 FROM dimension_references d 
        WHERE d.make = c.make 
            AND c.model LIKE d.model || '%'
            AND c.year BETWEEN d.year_start AND d.year_end
            AND d.make IS NOT NULL
    );
    RAISE NOTICE 'Total: %. With specific dims: %', v_total, v_specific;
END $$;