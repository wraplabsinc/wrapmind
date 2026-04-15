-- Fix get_available_packages type mismatch
-- CASE statements return text by default, but RETURNS expects VARCHAR(20)
CREATE OR REPLACE FUNCTION get_available_packages(p_vehicle_type vehicle_type DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    code VARCHAR,
    description TEXT,
    coverage_percentage INTEGER,
    estimated_sqft DECIMAL,
    starting_price DECIMAL,
    category VARCHAR(20)
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
        ROUND((p.labor_hours * p.labor_rate_per_hour + p.base_cost) * 1.30, 2) as starting_price,
        CASE 
            WHEN p.code LIKE 'FULL-%' THEN 'full'::VARCHAR(20)
            WHEN p.code LIKE 'PART-%' THEN 'partial'::VARCHAR(20)
            WHEN p.code LIKE 'ACCENT-%' THEN 'accent'::VARCHAR(20)
            WHEN p.code LIKE 'COMM-%' THEN 'commercial'::VARCHAR(20)
            WHEN p.code LIKE 'PPF-%' THEN 'ppf'::VARCHAR(20)
            ELSE 'other'::VARCHAR(20)
        END as category
    FROM wrap_packages p
    WHERE p.is_active = true
    ORDER BY p.sort_order;
END;
$$ LANGUAGE plpgsql;
