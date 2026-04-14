-- Drop existing functions
DROP FUNCTION IF EXISTS calculate_wrap_material(UUID);
DROP FUNCTION IF EXISTS calculate_wrap_from_body_parts(JSONB);
DROP FUNCTION IF EXISTS get_wrap_estimate(UUID);

-- Function: Calculate wrap material needed for a full wrap
CREATE OR REPLACE FUNCTION calculate_wrap_material(p_car_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_body_parts JSONB;
    v_total_sq_mm DECIMAL := 0;
    v_sq_feet DECIMAL;
    v_linear_feet_60 DECIMAL;
    v_linear_feet_54 DECIMAL;
    v_linear_feet_48 DECIMAL;
    v_part_key TEXT;
    v_part_data JSONB;
BEGIN
    SELECT body_parts INTO v_body_parts FROM cars WHERE id = p_car_id;
    
    IF v_body_parts IS NULL THEN
        RETURN jsonb_build_object('error', 'Car not found');
    END IF;
    
    -- Sum up length_mm * width_mm for each body part
    FOR v_part_key, v_part_data IN 
        SELECT key, value FROM jsonb_each(v_body_parts)
        WHERE key NOT IN ('material', 'estimated')
    LOOP
        -- Direct multiplication avoiding NULLIF issues
        v_total_sq_mm := v_total_sq_mm + 
            (v_part_data->>'length_mm')::DECIMAL * 
            (v_part_data->>'width_mm')::DECIMAL;
    END LOOP;
    
    -- Convert sq mm to sq inches (1 inch = 25.4 mm, so 1 sq inch = 645.16 sq mm)
    -- Convert sq inches to sq feet (1 sq foot = 144 sq inches)
    -- Combined: sq feet = sq mm / 645.16 / 144 = sq mm / 92903.04
    v_sq_feet := v_total_sq_mm / 92903.04;
    
    -- Calculate linear feet for standard wrap widths
    v_linear_feet_60 := v_sq_feet / 5.0;
    v_linear_feet_54 := v_sq_feet / 4.5;
    v_linear_feet_48 := v_sq_feet / 4.0;
    
    RETURN jsonb_build_object(
        'car_id', p_car_id,
        'total_sq_mm', v_total_sq_mm,
        'total_sq_feet', ROUND(v_sq_feet, 2),
        'wrap_linear_feet', jsonb_build_object(
            'width_60in', ROUND(v_linear_feet_60, 2),
            'width_54in', ROUND(v_linear_feet_54, 2),
            'width_48in', ROUND(v_linear_feet_48, 2)
        ),
        'assumptions', jsonb_build_array(
            'Calculated as sum of (length x width) for each body part',
            'Does not account for mirrors, badging, seams, or complex curves',
            'Recommend adding 15-20% waste factor for professional install',
            'Vehicle shape may require additional material for wrap stretch'
        ),
        'recommended_order', jsonb_build_object(
            'sq_feet_with_waste', ROUND(v_sq_feet * 1.20, 2),
            'linear_60in_with_waste', ROUND(v_linear_feet_60 * 1.20, 2)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Simple version: Calculate from body_parts JSONB directly
CREATE OR REPLACE FUNCTION calculate_wrap_from_body_parts(p_body_parts JSONB)
RETURNS JSONB AS $$
DECLARE
    v_total_sq_mm DECIMAL := 0;
    v_sq_feet DECIMAL;
    v_linear_feet_60 DECIMAL;
    v_linear_feet_54 DECIMAL;
    v_linear_feet_48 DECIMAL;
    v_part_key TEXT;
    v_part_data JSONB;
BEGIN
    FOR v_part_key, v_part_data IN 
        SELECT key, value FROM jsonb_each(p_body_parts)
        WHERE key NOT IN ('material', 'estimated')
    LOOP
        v_total_sq_mm := v_total_sq_mm + 
            (v_part_data->>'length_mm')::DECIMAL * 
            (v_part_data->>'width_mm')::DECIMAL;
    END LOOP;
    
    v_sq_feet := v_total_sq_mm / 92903.04;
    v_linear_feet_60 := v_sq_feet / 5.0;
    v_linear_feet_54 := v_sq_feet / 4.5;
    v_linear_feet_48 := v_sq_feet / 4.0;
    
    RETURN jsonb_build_object(
        'total_sq_mm', v_total_sq_mm,
        'total_sq_feet', ROUND(v_sq_feet, 2),
        'linear_feet_60in', ROUND(v_linear_feet_60, 2),
        'linear_feet_54in', ROUND(v_linear_feet_54, 2),
        'linear_feet_48in', ROUND(v_linear_feet_48, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- REST API callable version
CREATE OR REPLACE FUNCTION get_wrap_estimate(p_car_id UUID)
RETURNS TABLE (
    car_id UUID,
    year INTEGER,
    make VARCHAR,
    model VARCHAR,
    total_sq_feet DECIMAL,
    linear_feet_60in DECIMAL,
    linear_feet_54in DECIMAL,
    linear_feet_48in DECIMAL,
    recommended_sqft DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.year,
        c.make,
        c.model,
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'total_sq_feet')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'linear_feet_60in')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'linear_feet_54in')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'linear_feet_48in')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'total_sq_feet')::DECIMAL) * 1.20, 2)
    FROM cars c
    WHERE c.id = p_car_id;
END;
$$ LANGUAGE plpgsql;