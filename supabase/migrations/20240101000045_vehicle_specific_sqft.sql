-- Calculate actual wrap surface area based on vehicle dimensions and coverage parts
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
    
    FOR v_part IN SELECT jsonb_array_elements_text(p_coverage_parts)
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

-- Update get_available_packages to include vehicle_specific_sqft
DROP FUNCTION IF EXISTS get_available_packages(vehicle_type);

CREATE FUNCTION get_available_packages(
    p_vehicle_type vehicle_type DEFAULT NULL,
    p_length_mm INTEGER DEFAULT NULL,
    p_width_mm INTEGER DEFAULT NULL,
    p_height_mm INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    code VARCHAR,
    description TEXT,
    coverage_percentage INTEGER,
    estimated_sqft DECIMAL,
    vehicle_specific_sqft DECIMAL,
    labor_hours DECIMAL,
    labor_rate_per_hour DECIMAL,
    base_cost DECIMAL,
    starting_price DECIMAL,
    category VARCHAR(20),
    coverage_parts JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.code,
        p.description,
        (p.coverage_area->>'percentage')::INTEGER as coverage_percentage,
        ROUND(250.00 * (p.coverage_area->>'percentage')::INTEGER / 100, 2) as estimated_sqft,
        CASE
            WHEN p_length_mm IS NOT NULL AND p_width_mm IS NOT NULL AND p_height_mm IS NOT NULL
            THEN calculate_vehicle_wrap_sqft(p_length_mm, p_width_mm, p_height_mm, p.coverage_area->'parts')
            ELSE NULL
        END as vehicle_specific_sqft,
        p.labor_hours,
        p.labor_rate_per_hour,
        p.base_cost,
        ROUND((p.labor_hours * p.labor_rate_per_hour + p.base_cost) * 1.30, 2) as starting_price,
        CASE
            WHEN p.code LIKE 'FULL-%' THEN 'full'::VARCHAR(20)
            WHEN p.code LIKE 'PART-%' THEN 'partial'::VARCHAR(20)
            WHEN p.code LIKE 'ACCENT-%' THEN 'accent'::VARCHAR(20)
            WHEN p.code LIKE 'COMM-%' THEN 'commercial'::VARCHAR(20)
            WHEN p.code LIKE 'PPF-%' THEN 'ppf'::VARCHAR(20)
            ELSE 'other'::VARCHAR(20)
        END as category,
        p.coverage_area->'parts' as coverage_parts
    FROM wrap_packages p
    WHERE p.is_active = true
    ORDER BY p.sort_order;
END;
$$ LANGUAGE plpgsql;
