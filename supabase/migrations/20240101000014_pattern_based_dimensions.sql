-- Migration: Add pattern-based dimension matching for model names
-- Uses LIKE to match "Camry" in "Camry LE", "Camry XSE", etc.

-- Drop the previous update function and create improved one
CREATE OR REPLACE FUNCTION update_car_dimensions_by_pattern()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
    v_count INTEGER := 0;
    v_car RECORD;
    v_dim RECORD;
BEGIN
    FOR v_car IN SELECT id, vehicle_type, make, model, year FROM cars LOOP
        -- Try exact make/model match first
        SELECT * INTO v_dim
        FROM dimension_references
        WHERE make = v_car.make 
            AND model = v_car.model
            AND year_start <= v_car.year 
            AND year_end >= v_car.year
            AND make IS NOT NULL
        LIMIT 1;
        
        -- If not found, try pattern match on model name
        IF NOT FOUND THEN
            SELECT * INTO v_dim
            FROM dimension_references d
            WHERE d.make = v_car.make 
                AND v_car.model LIKE d.model || '%'
                AND d.year_start <= v_car.year 
                AND d.year_end >= v_car.year
                AND d.make IS NOT NULL
            LIMIT 1;
        END IF;
        
        -- If still not found, use generic vehicle_type
        IF NOT FOUND OR v_dim IS NULL THEN
            SELECT * INTO v_dim
            FROM dimension_references d
            WHERE d.vehicle_type = v_car.vehicle_type
                AND d.make IS NULL
            LIMIT 1;
        END IF;
        
        -- Update car if we found dimensions
        IF v_dim IS NOT NULL AND v_dim.length_mm IS NOT NULL THEN
            UPDATE cars SET
                length_mm = v_dim.length_mm,
                width_mm = v_dim.width_mm,
                height_mm = v_dim.height_mm,
                wheelbase_mm = v_dim.wheelbase_mm,
                ground_clearance_mm = v_dim.ground_clearance_mm,
                curb_weight_kg = v_dim.curb_weight_kg
            WHERE id = v_car.id;
            
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Also create a simpler version that does bulk update with LIKE matching
CREATE OR REPLACE FUNCTION update_car_dimensions_bulk()
RETURNS VOID AS $$
BEGIN
    -- Update with exact make/model matches
    UPDATE cars c
    SET 
        length_mm = d.length_mm,
        width_mm = d.width_mm,
        height_mm = d.height_mm,
        wheelbase_mm = d.wheelbase_mm,
        ground_clearance_mm = d.ground_clearance_mm,
        curb_weight_kg = d.curb_weight_kg
    FROM dimension_references d
    WHERE d.make = c.make 
        AND d.model = c.model
        AND d.year_start <= c.year 
        AND d.year_end >= c.year
        AND d.make IS NOT NULL;
    
    -- Update with pattern matches for remaining cars
    UPDATE cars c
    SET 
        length_mm = d.length_mm,
        width_mm = d.width_mm,
        height_mm = d.height_mm,
        wheelbase_mm = d.wheelbase_mm,
        ground_clearance_mm = d.ground_clearance_mm,
        curb_weight_kg = d.curb_weight_kg
    FROM dimension_references d
    WHERE d.make = c.make 
        AND c.model LIKE d.model || '%'
        AND d.year_start <= c.year 
        AND d.year_end >= c.year
        AND d.make IS NOT NULL
        AND c.length_mm IS NULL;
END;
$$ LANGUAGE plpgsql;