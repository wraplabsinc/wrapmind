-- Add wholesale_price to get_wrap_materials response
DROP FUNCTION IF EXISTS get_wrap_materials(VARCHAR);

CREATE FUNCTION get_wrap_materials(p_category VARCHAR DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    code VARCHAR,
    category VARCHAR(50),
    price_per_sqft DECIMAL,
    wholesale_price DECIMAL,
    durability_years INTEGER,
    warranty_years INTEGER,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.code,
        m.category::VARCHAR(50),
        m.price_per_sqft,
        m.wholesale_price,
        m.durability_years,
        m.warranty_years,
        m.description
    FROM wrap_materials m
    WHERE m.is_active = true
        AND (p_category IS NULL OR m.category = p_category)
    ORDER BY m.category, m.price_per_sqft;
END;
$$ LANGUAGE plpgsql;
