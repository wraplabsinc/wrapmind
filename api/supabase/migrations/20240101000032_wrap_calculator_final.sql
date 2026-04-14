-- Wrap Material Calculator Functions

-- Drop old versions
DROP FUNCTION IF EXISTS calculate_wrap_material(UUID);
DROP FUNCTION IF EXISTS calculate_wrap_from_body_parts(JSONB);
DROP FUNCTION IF EXISTS get_wrap_estimate(UUID);
DROP FUNCTION IF EXISTS calculate_wrap_v2(UUID);

-- Main function: Calculate wrap material needed for a car
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
    v_len DECIMAL;
    v_wid DECIMAL;
    v_car RECORD;
BEGIN
    -- Get car info and body parts
    SELECT * INTO v_car FROM cars WHERE id = p_car_id;
    
    IF v_car IS NULL THEN
        RETURN jsonb_build_object('error', 'Car not found');
    END IF;
    
    v_body_parts := v_car.body_parts;
    
    -- Sum up length x width for each body part
    FOR v_part_key, v_part_data IN 
        SELECT key, value FROM jsonb_each(v_body_parts)
        WHERE key NOT IN ('material', 'estimated')
    LOOP
        v_len := (v_part_data->>'length_mm')::DECIMAL;
        v_wid := (v_part_data->>'width_mm')::DECIMAL;
        
        IF v_len IS NOT NULL AND v_wid IS NOT NULL THEN
            v_total_sq_mm := v_total_sq_mm + (v_len * v_wid);
        END IF;
    END LOOP;
    
    -- Convert sq mm to sq feet (1 sq foot = 92903.04 sq mm)
    v_sq_feet := v_total_sq_mm / 92903.04;
    
    -- Calculate linear feet for standard wrap widths
    v_linear_feet_60 := v_sq_feet / 5.0;   -- 60 inch (5 ft) wide material
    v_linear_feet_54 := v_sq_feet / 4.5;   -- 54 inch (4.5 ft) wide material
    v_linear_feet_48 := v_sq_feet / 4.0;   -- 48 inch (4 ft) wide material
    
    RETURN jsonb_build_object(
        'car_id', p_car_id,
        'year', v_car.year,
        'make', v_car.make,
        'model', v_car.model,
        'vehicle_type', v_car.vehicle_type,
        'total_sq_mm', v_total_sq_mm,
        'total_sq_feet', ROUND(v_sq_feet, 2),
        'linear_feet', jsonb_build_object(
            'width_60in', ROUND(v_linear_feet_60, 2),
            'width_54in', ROUND(v_linear_feet_54, 2),
            'width_48in', ROUND(v_linear_feet_48, 2)
        ),
        'recommended_order', jsonb_build_object(
            'sq_feet_with_15pct_waste', ROUND(v_sq_feet * 1.15, 2),
            'sq_feet_with_20pct_waste', ROUND(v_sq_feet * 1.20, 2),
            'linear_ft_60in_with_20pct_waste', ROUND(v_linear_feet_60 * 1.20, 2)
        ),
        'notes', jsonb_build_array(
            'Calculated as sum of (length x width) for each body part',
            'Does not account for mirrors, badging, seams, or complex curves',
            'Add 15-20% waste factor for professional install',
            'Vehicle shape may require additional material for wrap stretch'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Simple version: Calculate directly from body_parts JSONB
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
    v_len DECIMAL;
    v_wid DECIMAL;
BEGIN
    FOR v_part_key, v_part_data IN 
        SELECT key, value FROM jsonb_each(p_body_parts)
        WHERE key NOT IN ('material', 'estimated')
    LOOP
        v_len := (v_part_data->>'length_mm')::DECIMAL;
        v_wid := (v_part_data->>'width_mm')::DECIMAL;
        
        IF v_len IS NOT NULL AND v_wid IS NOT NULL THEN
            v_total_sq_mm := v_total_sq_mm + (v_len * v_wid);
        END IF;
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
        'linear_feet_48in', ROUND(v_linear_feet_48, 2),
        'recommended_sqft_with_20pct_waste', ROUND(v_sq_feet * 1.20, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- REST API table function: Get wrap estimate with car details
CREATE OR REPLACE FUNCTION get_wrap_estimate(p_car_id UUID)
RETURNS TABLE (
    car_id UUID,
    year INTEGER,
    make VARCHAR,
    model VARCHAR,
    vehicle_type vehicle_type,
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
        c.vehicle_type,
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'total_sq_feet')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'linear_feet_60in')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'linear_feet_54in')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'linear_feet_48in')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'total_sq_feet')::DECIMAL) * 1.20, 2)
    FROM cars c
    WHERE c.id = p_car_id;
END;
$$ LANGUAGE plpgsql;

-- Bulk wrap estimate for multiple cars
CREATE OR REPLACE FUNCTION get_bulk_wrap_estimates(p_car_ids UUID[])
RETURNS TABLE (
    car_id UUID,
    year INTEGER,
    make VARCHAR,
    model VARCHAR,
    vehicle_type vehicle_type,
    total_sq_feet DECIMAL,
    recommended_sqft DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.year,
        c.make,
        c.model,
        c.vehicle_type,
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'total_sq_feet')::DECIMAL), 2),
        ROUND(((calculate_wrap_from_body_parts(c.body_parts)->>'total_sq_feet')::DECIMAL) * 1.20, 2)
    FROM cars c
    WHERE c.id = ANY(p_car_ids);
END;
$$ LANGUAGE plpgsql;