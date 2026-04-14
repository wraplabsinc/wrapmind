-- Fix: Drop and recreate vin_year_codes with proper data
DROP TABLE IF EXISTS vin_year_codes;

CREATE TABLE IF NOT EXISTS vin_year_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_char VARCHAR(1) NOT NULL,
    year INTEGER NOT NULL,
    UNIQUE(year_char, year)
);

-- Insert all year codes with 30-year offset
INSERT INTO vin_year_codes (year_char, year) VALUES
-- 1980s
('A', 1980), ('B', 1981), ('C', 1982), ('D', 1983), ('E', 1984),
('F', 1985), ('G', 1986), ('H', 1987), ('J', 1988), ('K', 1989),
('L', 1990), ('M', 1991), ('N', 1992), ('P', 1993), ('R', 1994),
('S', 1995), ('T', 1996), ('V', 1997), ('W', 1998), ('X', 1999),
-- 2000s
('Y', 2000), ('1', 2001), ('2', 2002), ('3', 2003), ('4', 2004),
('5', 2005), ('6', 2006), ('7', 2007), ('8', 2008), ('9', 2009),
-- 2010s
('A', 2010), ('B', 2011), ('C', 2012), ('D', 2013), ('E', 2014),
('F', 2015), ('G', 2016), ('H', 2017), ('J', 2018), ('K', 2019),
-- 2020s
('L', 2020), ('M', 2021), ('N', 2022), ('P', 2023), ('R', 2024),
('S', 2025), ('T', 2026), ('V', 2027), ('W', 2028), ('X', 2029),
('Y', 2030), ('1', 2031), ('2', 2032), ('3', 2033), ('4', 2034),
('5', 2035), ('6', 2036), ('7', 2037), ('8', 2038), ('9', 2039);

-- Update the decode function to get most recent year
CREATE OR REPLACE FUNCTION decode_vin_complete(p_vin VARCHAR(17))
RETURNS JSONB AS $$
DECLARE
    v_wmi VARCHAR(3);
    v_vds VARCHAR(6);
    v_year_char VARCHAR(1);
    v_plant_char VARCHAR(1);
    v_serial VARCHAR(6);
    v_result JSONB;
    v_wmi_rec wmi_codes%ROWTYPE;
    v_year INTEGER;
    v_plant_rec vin_plant_codes%ROWTYPE;
BEGIN
    -- Validate VIN
    IF LENGTH(p_vin) != 17 THEN
        RETURN jsonb_build_object('error', 'VIN must be 17 characters');
    END IF;
    
    -- Check for invalid characters (I, O, Q in positions 1-8, 10, 11)
    IF p_vin ~ '[IOQ]' THEN
        RETURN jsonb_build_object('error', 'VIN contains invalid characters (I, O, Q)');
    END IF;
    
    -- Parse VIN components
    v_wmi := UPPER(SUBSTRING(p_vin FROM 1 FOR 3));
    v_vds := UPPER(SUBSTRING(p_vin FROM 4 FOR 6));
    v_year_char := UPPER(SUBSTRING(p_vin FROM 10 FOR 1));
    v_plant_char := UPPER(SUBSTRING(p_vin FROM 11 FOR 1));
    v_serial := SUBSTRING(p_vin FROM 12 FOR 6);
    
    -- Look up WMI
    SELECT * INTO v_wmi_rec FROM wmi_codes WHERE wmi = v_wmi;
    
    -- Look up year (most recent match - for current vehicles use 2010+)
    -- Prefer years >= 2010 for modern vehicles
    SELECT COALESCE(
        (SELECT year FROM vin_year_codes WHERE year_char = v_year_char AND year >= 2010 ORDER BY year DESC LIMIT 1),
        (SELECT year FROM vin_year_codes WHERE year_char = v_year_char ORDER BY year DESC LIMIT 1)
    ) INTO v_year;
    
    -- Look up plant
    IF v_wmi_rec.manufacturer IS NOT NULL THEN
        SELECT * INTO v_plant_rec 
        FROM vin_plant_codes 
        WHERE plant_char = v_plant_char AND manufacturer = v_wmi_rec.manufacturer;
    END IF;
    
    -- Build result
    v_result := jsonb_build_object(
        'valid', true,
        'vin', p_vin,
        'wmi', v_wmi,
        'vds', v_vds,
        'manufacturer', COALESCE(v_wmi_rec.manufacturer, 'Unknown'),
        'country', COALESCE(v_wmi_rec.country, 'Unknown'),
        'vehicle_type', COALESCE(v_wmi_rec.vehicle_type, 'Unknown'),
        'year', v_year,
        'year_char', v_year_char,
        'plant_char', v_plant_char,
        'plant_name', v_plant_rec.plant_name,
        'plant_country', v_plant_rec.country,
        'serial_number', v_serial
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;