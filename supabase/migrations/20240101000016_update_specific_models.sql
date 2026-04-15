-- Migration: Update specific models with pattern matching
-- Run targeted updates for common models that use suffixes like "2WD", "4WD", "AWD", etc.

-- Update Toyota 4Runner
UPDATE cars c
SET 
    length_mm = 4830,
    width_mm = 1925,
    height_mm = 1910,
    wheelbase_mm = 2790,
    ground_clearance_mm = 240
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = '4Runner'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota RAV4
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'RAV4'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Highlander
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Highlander'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Sequoia
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Sequoia'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Tacoma
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Tacoma'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Tundra
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Tundra'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Sienna
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Sienna'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Prius
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Prius'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Camry
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Camry'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Update Toyota Corolla
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm
FROM dimension_references d
WHERE d.make = 'Toyota' 
    AND d.model = 'Corolla'
    AND c.make = d.make 
    AND c.model LIKE d.model || '%'
    AND c.year BETWEEN d.year_start AND d.year_end
    AND d.make IS NOT NULL;

-- Log counts
DO $$
DECLARE
    v_toyota_count INTEGER;
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_toyota_count FROM cars WHERE make = 'Toyota';
    SELECT COUNT(*) INTO v_total FROM cars;
    RAISE NOTICE 'Toyota vehicles: %. Total vehicles: %', v_toyota_count, v_total;
END $$;