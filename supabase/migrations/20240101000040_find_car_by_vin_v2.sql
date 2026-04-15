-- Recreate find_car_by_vin to use decode_vin_complete for lookup
DROP FUNCTION IF EXISTS find_car_by_vin(VARCHAR(17));

CREATE FUNCTION find_car_by_vin(p_vin VARCHAR(17))
RETURNS TABLE (
    id UUID,
    year INTEGER,
    make VARCHAR,
    model VARCHAR,
    "trim" VARCHAR,
    vehicle_type vehicle_type,
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    wheelbase_mm INTEGER,
    ground_clearance_mm INTEGER,
    curb_weight_kg DECIMAL,
    vin VARCHAR(17),
    match_confidence VARCHAR(20)
) AS $$
DECLARE
    v_decoded JSONB;
    v_year INTEGER;
    v_make VARCHAR;
BEGIN
    -- Decode the VIN
    v_decoded := decode_vin_complete(p_vin);
    
    IF v_decoded ? 'error' THEN
        RETURN;
    END IF;
    
    -- Extract year and make from decoded VIN
    v_year := (v_decoded->>'year')::INTEGER;
    v_make := v_decoded->>'manufacturer';
    
    -- Try to find exact match by year and make
    RETURN QUERY 
    SELECT 
        c.id, c.year, c.make, c.model, c.trim, c.vehicle_type,
        c.length_mm, c.width_mm, c.height_mm, c.wheelbase_mm,
        c.ground_clearance_mm, c.curb_weight_kg,
        p_vin::VARCHAR(17) as vin,
        'high'::VARCHAR(20) as match_confidence
    FROM cars c
    WHERE UPPER(c.make) = UPPER(v_make)
        AND c.year = v_year
    LIMIT 1;
    
END;
$$ LANGUAGE plpgsql;