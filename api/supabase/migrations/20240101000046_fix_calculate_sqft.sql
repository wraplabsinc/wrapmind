-- Recreate calculate_vehicle_wrap_sqft with proper JSONB array iteration
CREATE OR REPLACE FUNCTION calculate_vehicle_wrap_sqft(
    p_length_mm INTEGER,
    p_width_mm INTEGER,
    p_height_mm INTEGER,
    p_coverage_parts JSONB
) RETURNS DECIMAL AS $$
DECLARE
    v_sqft DECIMAL := 0;
    v_length_m DECIMAL;
    v_width_m DECIMAL;
    v_height_m DECIMAL;
    v_part TEXT;
BEGIN
    v_length_m := p_length_mm / 1000.0;
    v_width_m := p_width_mm / 1000.0;
    v_height_m := p_height_mm / 1000.0;
    
    IF p_coverage_parts IS NULL THEN
        RETURN ROUND(2 * (v_length_m * v_width_m + v_length_m * v_height_m + v_width_m * v_height_m) * 10.764, 2);
    END IF;
    
    FOR v_part IN SELECT * FROM jsonb_array_elements_text(p_coverage_parts)
    LOOP
        CASE v_part
            WHEN 'hood' THEN
                v_sqft := v_sqft + (v_length_m * v_width_m * 0.7 * 10.764);
            WHEN 'roof' THEN
                v_sqft := v_sqft + (v_length_m * v_width_m * 0.85 * 10.764);
            WHEN 'doors' THEN
                v_sqft := v_sqft + (v_height_m * v_length_m * 0.6 * 4 * 10.764);
            WHEN 'fenders' THEN
                v_sqft := v_sqft + (v_height_m * v_length_m * 0.3 * 4 * 10.764);
            WHEN 'bumpers' THEN
                v_sqft := v_sqft + (v_height_m * v_width_m * 0.8 * 2 * 10.764);
            WHEN 'mirrors' THEN
                v_sqft := v_sqft + (0.2 * 4 * 10.764);
            WHEN 'trunk' THEN
                v_sqft := v_sqft + (v_length_m * v_width_m * 0.5 * 10.764);
            WHEN 'bed' THEN
                v_sqft := v_sqft + (v_length_m * v_width_m * 0.7 * 10.764);
            WHEN 'cab' THEN
                v_sqft := v_sqft + (v_length_m * v_width_m * v_height_m * 0.5 * 10.764);
            ELSE
                v_sqft := v_sqft + (v_length_m * v_width_m * 0.5 * 10.764);
        END CASE;
    END LOOP;
    
    RETURN ROUND(v_sqft, 2);
END;
$$ LANGUAGE plpgsql;
