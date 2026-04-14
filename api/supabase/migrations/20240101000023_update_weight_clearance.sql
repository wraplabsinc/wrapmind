-- Migration: Update ground_clearance, curb_weight for all cars from dimension_references

-- Update ground_clearance_mm
UPDATE cars c
SET ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = c.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL
    AND d.ground_clearance_mm IS NOT NULL;

-- Update remaining with generic vehicle_type ground_clearance
UPDATE cars c
SET ground_clearance_mm = d.ground_clearance_mm
FROM (
    SELECT DISTINCT ON (vehicle_type)
        vehicle_type,
        ground_clearance_mm
    FROM dimension_references
    WHERE make IS NULL AND ground_clearance_mm IS NOT NULL
) d
WHERE c.vehicle_type = d.vehicle_type
    AND c.ground_clearance_mm IS NULL;

-- Update curb_weight_kg
UPDATE cars c
SET curb_weight_kg = d.curb_weight_kg
FROM dimension_references d
WHERE d.make = c.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL
    AND d.curb_weight_kg IS NOT NULL;

-- Update remaining with generic vehicle_type curb_weight
UPDATE cars c
SET curb_weight_kg = d.curb_weight_kg
FROM (
    SELECT DISTINCT ON (vehicle_type)
        vehicle_type,
        curb_weight_kg
    FROM dimension_references
    WHERE make IS NULL AND curb_weight_kg IS NOT NULL
) d
WHERE c.vehicle_type = d.vehicle_type
    AND c.curb_weight_kg IS NULL;

-- Estimate gross_weight_kg as curb_weight + 150kg (average passengers/cargo)
UPDATE cars c
SET gross_weight_kg = curb_weight_kg + 150
WHERE curb_weight_kg IS NOT NULL AND gross_weight_kg IS NULL;

-- Summary
DO $$
DECLARE
    v_total INTEGER;
    v_gc INTEGER;
    v_cw INTEGER;
    v_gw INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM cars;
    SELECT COUNT(*) INTO v_gc FROM cars WHERE ground_clearance_mm IS NOT NULL;
    SELECT COUNT(*) INTO v_cw FROM cars WHERE curb_weight_kg IS NOT NULL;
    SELECT COUNT(*) INTO v_gw FROM cars WHERE gross_weight_kg IS NOT NULL;
    RAISE NOTICE 'Total: %. GC: % (%.1f%%) CW: % (%.1f%%) GW: % (%.1f%%)', 
        v_total, v_gc, (v_gc * 100.0 / v_total), 
        v_cw, (v_cw * 100.0 / v_total),
        v_gw, (v_gw * 100.0 / v_total);
END $$;