-- Migration: Add roof dimensions to body_parts JSONB

-- Add roof to all cars' body_parts
UPDATE cars
SET body_parts = jsonb_set(
    body_parts,
    '{roof}',
    to_jsonb(jsonb_build_object(
        'material', 'estimated',
        'length_mm', GREATEST(50, (length_mm * 0.65)::integer),
        'width_mm', GREATEST(50, (width_mm * 0.92)::integer),
        'height_mm', GREATEST(20, (height_mm * 0.12)::integer)
    ))
)
WHERE length_mm IS NOT NULL 
    AND width_mm IS NOT NULL 
    AND height_mm IS NOT NULL
    AND NOT (body_parts ? 'roof');

-- Log count
DO $$
DECLARE
    v_roof INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_roof FROM cars WHERE body_parts ? 'roof';
    RAISE NOTICE 'Cars with roof in body_parts: %', v_roof;
END $$;