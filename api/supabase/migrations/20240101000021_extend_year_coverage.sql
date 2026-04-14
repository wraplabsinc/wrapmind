-- Migration: Add more year ranges and extend coverage

-- Extend Ford Bronco to 2026
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('suv', 'compact', 'Ford', 'Bronco', 2021, 2026, 4810, 2170, 1870, 2950, 260, 2150)
ON CONFLICT (vehicle_type, size_class, make, model, year_start) DO UPDATE SET
    year_end = EXCLUDED.year_end, length_mm = EXCLUDED.length_mm;

-- Add Toyota Camry older years (2007-2011)
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Toyota', 'Camry', 2007, 2011, 4805, 1820, 1470, 2775, 145, 1510),
('sedan', 'midsize', 'Toyota', 'Camry', 2002, 2006, 4815, 1795, 1480, 2720, 145, 1490)
ON CONFLICT DO NOTHING;

-- Add Honda Accord older years
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Honda', 'Accord', 2003, 2007, 4810, 1815, 1465, 2740, 145, 1500)
ON CONFLICT DO NOTHING;

-- Add Ford F-150 older years
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('truck', 'half_ton', 'Ford', 'F-150', 2004, 2008, 5695, 2020, 1960, 3685, 240, 2180)
ON CONFLICT DO NOTHING;

-- Add generic defaults for older years where we don't have specific data
-- These use conservative estimates based on typical vehicle evolution

-- Generic sedan (used when no specific match exists)
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', NULL, NULL, 1995, 2005, 4775, 1800, 1450, 2750, 145, 1550),
('sedan', 'compact', NULL, NULL, 1995, 2005, 4500, 1730, 1430, 2620, 145, 1350),
('suv', 'midsize', NULL, NULL, 1995, 2005, 4650, 1850, 1720, 2750, 200, 1850),
('truck', 'half_ton', NULL, NULL, 1995, 2005, 5600, 2000, 1900, 3500, 240, 2100)
ON CONFLICT DO NOTHING;

-- Now update cars that still have the old generic dimensions (length_mm = 4600, 4800, 4900 which were our initial placeholders)
-- These are cars that never got updated because their years fell outside our references
UPDATE cars c
SET 
    length_mm = d.length_mm,
    width_mm = d.width_mm,
    height_mm = d.height_mm,
    wheelbase_mm = d.wheelbase_mm,
    ground_clearance_mm = d.ground_clearance_mm,
    curb_weight_kg = d.curb_weight_kg
FROM dimension_references d
WHERE d.make IS NULL
    AND d.vehicle_type = c.vehicle_type
    AND c.year BETWEEN d.year_start AND d.year_end
    AND c.length_mm IN (4600, 4800, 4900);  -- These were our original placeholder values

DO $$
DECLARE
    v_total INTEGER;
    v_placeholder INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM cars;
    SELECT COUNT(*) INTO v_placeholder FROM cars WHERE length_mm IN (4600, 4800, 4900);
    RAISE NOTICE 'Total: %. Remaining with placeholder dims: %', v_total, v_placeholder;
END $$;