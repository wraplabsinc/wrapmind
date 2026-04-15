-- Migration: Bulk update car dimensions efficiently
-- First update with specific make/model matches, then fill remaining with generic type averages

-- Step 1: Update cars that have exact make/model/year matches
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
    AND d.model = c.model
    AND d.year_start <= c.year 
    AND d.year_end >= c.year
    AND d.make IS NOT NULL;

-- Step 2: Update remaining cars with generic vehicle_type dimensions
-- Use a subquery to pick one generic dimension per vehicle_type
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
    AND c.length_mm IS NULL;  -- Only update cars without dimensions yet