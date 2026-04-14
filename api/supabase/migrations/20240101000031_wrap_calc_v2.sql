-- Drop existing functions first
DROP FUNCTION IF EXISTS calculate_wrap_material(UUID);
DROP FUNCTION IF EXISTS calculate_wrap_from_body_parts(JSONB);
DROP FUNCTION IF EXISTS get_wrap_estimate(UUID);
DROP FUNCTION IF EXISTS calculate_wrap_v2(UUID);

-- New improved function
CREATE OR REPLACE FUNCTION calculate_wrap_v2(p_car_id UUID)
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
BEGIN
    SELECT body_parts INTO v_body_parts FROM cars WHERE id = p_car_id;
    
    IF v_body_parts IS NULL THEN
        RETURN jsonb_build_object('error', 'Car not found');
    END IF;
    
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
    
    -- sq mm to sq feet: divide by 92903.04
    v_sq_feet := v_total_sq_mm / 92903.04;
    
    v_linear_feet_60 := v_sq_feet / 5.0;
    v_linear_feet_54 := v_sq_feet / 4.5;
    v_linear_feet_48 := v_sq_feet / 4.0;
    
    RETURN jsonb_build_object(
        'car_id', p_car_id,
        'total_sq_mm', v_total_sq_mm,
        'total_sq_feet', ROUND(v_sq_feet, 2),
        'linear_feet_60in', ROUND(v_linear_feet_60, 2),
        'linear_feet_54in', ROUND(v_linear_feet_54, 2),
        'linear_feet_48in', ROUND(v_linear_feet_48, 2),
        'recommended_sqft_with_20pct_waste', ROUND(v_sq_feet * 1.20, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- Test it
SELECT calculate_wrap_v2((SELECT id FROM cars LIMIT 1));