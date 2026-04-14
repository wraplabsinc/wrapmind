-- Vehicle Picker Functions for cascading dropdown selectors
-- Returns distinct values for year/make/model/trim pickers

-- Get all years
CREATE OR REPLACE FUNCTION get_vehicle_years()
RETURNS TABLE (year INTEGER) AS $$
BEGIN
    RETURN QUERY SELECT DISTINCT c.year FROM cars c ORDER BY c.year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get makes for a specific year
CREATE OR REPLACE FUNCTION get_vehicle_makes(p_year INTEGER)
RETURNS TABLE (make VARCHAR) AS $$
BEGIN
    RETURN QUERY SELECT DISTINCT c.make FROM cars c 
    WHERE c.year = p_year 
    ORDER BY c.make;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get models for a specific year and make
CREATE OR REPLACE FUNCTION get_vehicle_models(p_year INTEGER, p_make VARCHAR)
RETURNS TABLE (model VARCHAR) AS $$
BEGIN
    RETURN QUERY SELECT DISTINCT c.model FROM cars c 
    WHERE c.year = p_year AND UPPER(c.make) = UPPER(p_make)
    ORDER BY c.model;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trims for a specific year, make, and model
CREATE OR REPLACE FUNCTION get_vehicle_trims(p_year INTEGER, p_make VARCHAR, p_model VARCHAR)
RETURNS TABLE (trim_value VARCHAR) AS $$
BEGIN
    RETURN QUERY SELECT DISTINCT c.trim FROM cars c 
    WHERE c.year = p_year 
        AND UPPER(c.make) = UPPER(p_make)
        AND UPPER(c.model) = UPPER(p_model)
    ORDER BY c.trim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Full car lookup by year, make, model, trim
CREATE OR REPLACE FUNCTION find_car_by_ymmt(p_year INTEGER, p_make VARCHAR, p_model VARCHAR, p_trim VARCHAR)
RETURNS TABLE (
    id UUID,
    year INTEGER,
    make VARCHAR,
    model VARCHAR,
    trim_value VARCHAR,
    vehicle_type vehicle_type,
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    wheelbase_mm INTEGER,
    ground_clearance_mm INTEGER,
    curb_weight_kg DECIMAL,
    gross_weight_kg DECIMAL,
    body_parts JSONB
) AS $$
BEGIN
    RETURN QUERY SELECT 
        c.id, c.year, c.make, c.model, c.trim, c.vehicle_type,
        c.length_mm, c.width_mm, c.height_mm, c.wheelbase_mm,
        c.ground_clearance_mm, c.curb_weight_kg, c.gross_weight_kg,
        c.body_parts
    FROM cars c 
    WHERE c.year = p_year 
        AND UPPER(c.make) = UPPER(p_make)
        AND UPPER(c.model) = UPPER(p_model)
        AND UPPER(c.trim) = UPPER(p_trim)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get count of cars matching picker criteria
CREATE OR REPLACE FUNCTION get_vehicle_count(p_year INTEGER DEFAULT NULL, p_make VARCHAR DEFAULT NULL, p_model VARCHAR DEFAULT NULL)
RETURNS TABLE (count BIGINT) AS $$
BEGIN
    RETURN QUERY SELECT COUNT(*)::BIGINT FROM cars c 
    WHERE (p_year IS NULL OR c.year = p_year)
        AND (p_make IS NULL OR UPPER(c.make) = UPPER(p_make))
        AND (p_model IS NULL OR UPPER(c.model) = UPPER(p_model));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
