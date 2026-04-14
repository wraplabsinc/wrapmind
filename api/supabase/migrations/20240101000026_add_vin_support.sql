-- Migration: Add VIN support with lookup function

-- Add vin column back to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS vin VARCHAR(17) UNIQUE;

-- Create index for VIN lookups
CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);

-- Create VIN decode function (parses WMI and VDS from VIN)
CREATE OR REPLACE FUNCTION decode_vin(p_vin VARCHAR(17))
RETURNS JSONB AS $$
DECLARE
    v_wmi VARCHAR(3);
    v_result JSONB;
BEGIN
    -- Validate VIN length
    IF LENGTH(p_vin) != 17 THEN
        RETURN jsonb_build_object('error', 'VIN must be 17 characters');
    END IF;
    
    -- Extract WMI (World Manufacturer Identifier)
    v_wmi := UPPER(SUBSTRING(p_vin FROM 1 FOR 3));
    
    -- Basic WMI decoding (common manufacturers)
    v_result := CASE 
        WHEN v_wmi = '1G1' OR v_wmi = '1G2' THEN jsonb_build_object('make', 'Chevrolet', 'country', 'USA')
        WHEN v_wmi = '1FT' THEN jsonb_build_object('make', 'Ford', 'country', 'USA')
        WHEN v_wmi = '1GC' THEN jsonb_build_object('make', 'Chevrolet', 'country', 'USA')
        WHEN v_wmi = '1HG' THEN jsonb_build_object('make', 'Honda', 'country', 'USA')
        WHEN v_wmi = '1J4' THEN jsonb_build_object('make', 'Jeep', 'country', 'USA')
        WHEN v_wmi = '1N4' THEN jsonb_build_object('make', 'Nissan', 'country', 'USA')
        WHEN v_wmi = '2HG' THEN jsonb_build_object('make', 'Honda', 'country', 'Canada')
        WHEN v_wmi = '2HK' THEN jsonb_build_object('make', 'Honda', 'country', 'Canada')
        WHEN v_wmi = '3FA' THEN jsonb_build_object('make', 'Ford', 'country', 'Mexico')
        WHEN v_wmi = '3VW' THEN jsonb_build_object('make', 'Volkswagen', 'country', 'Mexico')
        WHEN v_wmi = '4T1' THEN jsonb_build_object('make', 'Toyota', 'country', 'USA')
        WHEN v_wmi = '5FN' THEN jsonb_build_object('make', 'Honda', 'country', 'USA')
        WHEN v_wmi = '5TD' THEN jsonb_build_object('make', 'Toyota', 'country', 'USA')
        WHEN v_wmi = '5YJ' THEN jsonb_build_object('make', 'Tesla', 'country', 'USA')
        WHEN v_wmi = 'JHM' THEN jsonb_build_object('make', 'Honda', 'country', 'Japan')
        WHEN v_wmi = 'JN1' THEN jsonb_build_object('make', 'Nissan', 'country', 'Japan')
        WHEN v_wmi = 'JT2' THEN jsonb_build_object('make', 'Toyota', 'country', 'Japan')
        WHEN v_wmi = 'JTD' THEN jsonb_build_object('make', 'Toyota', 'country', 'Japan')
        WHEN v_wmi = 'JTE' THEN jsonb_build_object('make', 'Toyota', 'country', 'Japan')
        WHEN v_wmi = 'KM8' THEN jsonb_build_object('make', 'Hyundai', 'country', 'South Korea')
        WHEN v_wmi = 'KNA' THEN jsonb_build_object('make', 'Kia', 'country', 'South Korea')
        WHEN v_wmi = 'WA1' THEN jsonb_build_object('make', 'Audi', 'country', 'Germany')
        WHEN v_wmi = 'WAU' THEN jsonb_build_object('make', 'Audi', 'country', 'Germany')
        WHEN v_wmi = 'WBA' THEN jsonb_build_object('make', 'BMW', 'country', 'Germany')
        WHEN v_wmi = 'WBS' THEN jsonb_build_object('make', 'BMW', 'country', 'Germany')
        WHEN v_wmi = 'WDB' THEN jsonb_build_object('make', 'Mercedes-Benz', 'country', 'Germany')
        WHEN v_wmi = 'WDD' THEN jsonb_build_object('make', 'Mercedes-Benz', 'country', 'Germany')
        WHEN v_wmi = 'WDC' THEN jsonb_build_object('make', 'Mercedes-Benz', 'country', 'Germany')
        WHEN v_wmi = 'WF0' THEN jsonb_build_object('make', 'Ford', 'country', 'Germany')
        WHEN v_wmi = 'WMW' THEN jsonb_build_object('make', 'Mini', 'country', 'Germany')
        WHEN v_wmi = 'WP0' THEN jsonb_build_object('make', 'Porsche', 'country', 'Germany')
        WHEN v_wmi = 'WVW' THEN jsonb_build_object('make', 'Volkswagen', 'country', 'Germany')
        WHEN v_wmi = 'YV1' THEN jsonb_build_object('make', 'Volvo', 'country', 'Sweden')
        WHEN v_wmi = 'ZFF' THEN jsonb_build_object('make', 'Ferrari', 'country', 'Italy')
        ELSE jsonb_build_object('make', NULL, 'country', 'Unknown')
    END;
    
    -- Add full VIN to result
    v_result := v_result || jsonb_build_object(
        'vin', p_vin,
        'wmi', v_wmi,
        'model_year', SUBSTRING(p_vin FROM 10 FOR 1),
        'plant_code', SUBSTRING(p_vin FROM 11 FOR 1),
        'serial_number', SUBSTRING(p_vin FROM 12 FOR 6)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to find car by VIN (returns full car record)
CREATE OR REPLACE FUNCTION find_car_by_vin(p_vin VARCHAR(17))
RETURNS cars AS $$
DECLARE
    v_car cars%ROWTYPE;
BEGIN
    SELECT * INTO v_car FROM cars WHERE vin = p_vin LIMIT 1;
    RETURN v_car;
END;
$$ LANGUAGE plpgsql;

-- Create function to find or create car from VIN
CREATE OR REPLACE FUNCTION find_or_create_car_from_vin(p_vin VARCHAR(17))
RETURNS cars AS $$
DECLARE
    v_car cars%ROWTYPE;
    v_vin_info JSONB;
BEGIN
    -- Check if car already exists
    SELECT * INTO v_car FROM cars WHERE vin = p_vin LIMIT 1;
    IF FOUND THEN
        RETURN v_car;
    END IF;
    
    -- Decode VIN to get make info
    v_vin_info := decode_vin(p_vin);
    
    -- Return empty car record for manual completion
    -- (In production, you'd call an external VIN API here)
    RETURN NULL::cars;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if any
DROP FUNCTION IF EXISTS find_car_by_vin(VARCHAR(17));

-- RPC function for REST API: GET /rest/v1/rpc/find_car_by_vin
CREATE OR REPLACE FUNCTION find_car_by_vin(p_vin VARCHAR(17))
RETURNS TABLE(
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
    body_parts JSONB
) AS $$
BEGIN
    RETURN QUERY SELECT 
        c.id, c.year, c.make, c.model, c.trim, c.vehicle_type,
        c.length_mm, c.width_mm, c.height_mm, c.wheelbase_mm,
        c.ground_clearance_mm, c.curb_weight_kg, c.body_parts
    FROM cars c 
    WHERE c.vin = p_vin;
END;
$$ LANGUAGE plpgsql;