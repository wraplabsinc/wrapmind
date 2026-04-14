-- Migration: Add comprehensive VIN decoder tables

-- 1. WMI (World Manufacturer Identifier) reference table
CREATE TABLE IF NOT EXISTS wmi_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wmi VARCHAR(3) NOT NULL UNIQUE,
    manufacturer VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Common WMI codes (expand as needed)
INSERT INTO wmi_codes (wmi, manufacturer, country, vehicle_type) VALUES
-- Tesla
('5YJ', 'Tesla', 'USA', 'passenger'),
('7C3', 'Tesla', 'USA', 'passenger'),
-- Toyota
('1G1', 'Chevrolet', 'USA', 'passenger'),
('1G2', 'Pontiac', 'USA', 'passenger'),
('1HG', 'Honda', 'USA', 'passenger'),
('2HG', 'Honda', 'Canada', 'passenger'),
('4T1', 'Toyota', 'USA', 'passenger'),
('5TD', 'Toyota', 'USA', 'truck'),
('JHM', 'Honda', 'Japan', 'passenger'),
('JT2', 'Toyota', 'Japan', 'passenger'),
('JTD', 'Toyota', 'Japan', 'passenger'),
('JTE', 'Toyota', 'Japan', 'suv'),
('JN1', 'Nissan', 'Japan', 'passenger'),
-- Ford
('1FT', 'Ford', 'USA', 'truck'),
('1FA', 'Ford', 'USA', 'passenger'),
('3FA', 'Ford', 'Mexico', 'passenger'),
('WF0', 'Ford', 'Germany', 'passenger'),
-- Chevrolet/GMC
('1GC', 'Chevrolet', 'USA', 'truck'),
('1G1', 'Chevrolet', 'USA', 'passenger'),
('1G2', 'Chevrolet', 'USA', 'passenger'),
('2G1', 'Chevrolet', 'Canada', 'passenger'),
-- BMW
('WBA', 'BMW', 'Germany', 'passenger'),
('WBS', 'BMW M', 'Germany', 'passenger'),
('3MW', 'BMW', 'Germany', 'passenger'),
-- Mercedes-Benz
('WDB', 'Mercedes-Benz', 'Germany', 'passenger'),
('WDD', 'Mercedes-Benz', 'Germany', 'passenger'),
('WDC', 'Mercedes-Benz', 'Germany', 'suv'),
('4JG', 'Mercedes-Benz', 'USA', 'suv'),
-- Audi/VW
('WAU', 'Audi', 'Germany', 'passenger'),
('WUA', 'Audi', 'Germany', 'passenger'),
('WVW', 'Volkswagen', 'Germany', 'passenger'),
('3VW', 'Volkswagen', 'Mexico', 'passenger'),
('1V2', 'Volkswagen', 'USA', 'suv'),
-- Nissan
('1N4', 'Nissan', 'USA', 'passenger'),
('JN1', 'Nissan', 'Japan', 'passenger'),
('5N1', 'Nissan', 'USA', 'suv'),
-- Hyundai/Kia
('5NP', 'Hyundai', 'USA', 'passenger'),
('KM8', 'Hyundai', 'South Korea', 'suv'),
('KNA', 'Kia', 'South Korea', 'passenger'),
('5XY', 'Kia', 'USA', 'suv'),
-- Honda
('5FN', 'Honda', 'USA', 'van'),
('93H', 'Honda', 'Mexico', 'passenger'),
-- Mazda
('JM1', 'Mazda', 'Japan', 'passenger'),
('1YV', 'Mazda', 'USA', 'passenger'),
-- Subaru
('JF1', 'Subaru', 'Japan', 'passenger'),
('JF2', 'Subaru', 'Japan', 'suv'),
-- Mitsubishi
('JA3', 'Mitsubishi', 'Japan', 'passenger'),
('JA4', 'Mitsubishi', 'Japan', 'suv'),
-- Porsche
('WP0', 'Porsche', 'Germany', 'passenger'),
('WP1', 'Porsche', 'Germany', 'suv'),
-- Volvo
('YV1', 'Volvo', 'Sweden', 'passenger'),
('4V2', 'Volvo', 'Sweden', 'truck'),
-- Jeep/Chrysler
('1J4', 'Jeep', 'USA', 'suv'),
('1C4', 'Chrysler', 'USA', 'suv'),
('2C3', 'Chrysler', 'Canada', 'passenger'),
('1C3', 'Chryser', 'USA', 'passenger'),
-- Dodge
('1B3', 'Dodge', 'USA', 'passenger'),
('1B7', 'Dodge', 'USA', 'truck'),
('2B3', 'Dodge', 'Canada', 'passenger'),
-- General Motors others
('1G3', 'Oldsmobile', 'USA', 'passenger'),
('1G4', 'Buick', 'USA', 'passenger'),
('1G6', 'Cadillac', 'USA', 'passenger'),
('1G8', 'Saturn', 'USA', 'passenger'),
('2G1', 'Chevrolet', 'Canada', 'passenger'),
('3G1', 'General Motors', 'Mexico', 'passenger'),
-- Ferrari/Lamborghini
('ZFF', 'Ferrari', 'Italy', 'passenger'),
('ZHW', 'Lamborghini', 'Italy', 'passenger'),
('YA3', 'Lamborghini', 'Italy', 'passenger'),
-- Other brands
('WMW', 'Mini', 'Germany', 'passenger'),
('WMW', 'Mini', 'Germany', 'passenger'),
('SAL', 'Land Rover', 'UK', 'suv'),
('SAL', 'Rover', 'UK', 'passenger'),
('VF1', 'Renault', 'France', 'passenger'),
('VF3', 'Peugeot', 'France', 'passenger'),
('VF7', 'Citroen', 'France', 'passenger'),
('U5Y', 'Kia', 'Slovakia', 'passenger'),
('UU3', 'Dacia', 'Romania', 'passenger'),
('XW8', 'Skoda', 'Czech Republic', 'passenger'),
('XWB', 'Skoda', 'Czech Republic', 'passenger'),
('TM9', 'Seat', 'Spain', 'passenger'),
('VSK', 'Nissan', 'Spain', 'passenger'),
('MPR', 'Mitsubishi', 'Netherlands', 'passenger')
ON CONFLICT (wmi) DO NOTHING;

-- 2. Model year codes (10th character in VIN)
CREATE TABLE IF NOT EXISTS vin_year_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_char VARCHAR(1) NOT NULL UNIQUE,
    year_start INTEGER NOT NULL,
    year_end INTEGER NOT NULL
);

INSERT INTO vin_year_codes (year_char, year_start, year_end) VALUES
('A', 1980, 1980), ('B', 1981, 1981), ('C', 1982, 1982), ('D', 1983, 1983),
('E', 1984, 1984), ('F', 1985, 1985), ('G', 1986, 1986), ('H', 1987, 1987),
('J', 1988, 1988), ('K', 1989, 1989), ('L', 1990, 1990), ('M', 1991, 1991),
('N', 1992, 1992), ('P', 1993, 1993), ('R', 1994, 1994), ('S', 1995, 1995),
('T', 1996, 1996), ('V', 1997, 1997), ('W', 1998, 1998), ('X', 1999, 1999),
('Y', 2000, 2000), ('1', 2001, 2001), ('2', 2002, 2002), ('3', 2003, 2003),
('4', 2004, 2004), ('5', 2005, 2005), ('6', 2006, 2006), ('7', 2007, 2007),
('8', 2008, 2008), ('9', 2009, 2009), ('A', 2010, 2010), ('B', 2011, 2011),
('C', 2012, 2012), ('D', 2013, 2013), ('E', 2014, 2014), ('F', 2015, 2015),
('G', 2016, 2016), ('H', 2017, 2017), ('J', 2018, 2018), ('K', 2019, 2019),
('L', 2020, 2020), ('M', 2021, 2021), ('N', 2022, 2022), ('P', 2023, 2023),
('R', 2024, 2024), ('S', 2025, 2025), ('T', 2026, 2026), ('V', 2027, 2027),
('W', 2028, 2028), ('X', 2029, 2029), ('Y', 2030, 2030)
ON CONFLICT (year_char) DO NOTHING;

-- 3. Plant codes (11th character)
CREATE TABLE IF NOT EXISTS vin_plant_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_char VARCHAR(1) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    plant_name VARCHAR(100),
    country VARCHAR(50),
    UNIQUE(plant_char, manufacturer)
);

-- Common plant codes
INSERT INTO vin_plant_codes (plant_char, manufacturer, plant_name, country) VALUES
-- Toyota
('C', 'Toyota', 'Georgetown, Kentucky', 'USA'),
('M', 'Toyota', 'Bwichi, Japan', 'Japan'),
('T', 'Toyota', 'Takaoka, Japan', 'Japan'),
('5', 'Toyota', 'San Antonio, Texas', 'USA'),
-- Honda
('A', 'Honda', 'Marysville, Ohio', 'USA'),
('B', 'Honda', 'Greensburg, Indiana', 'USA'),
('G', 'Honda', 'Alliston, Ontario', 'Canada'),
('M', 'Honda', 'El Salto, Mexico', 'Mexico'),
-- Ford
('A', 'Ford', 'Dearborn, Michigan', 'USA'),
('F', 'Ford', 'Oakville, Ontario', 'Canada'),
('G', 'Ford', 'Chicago, Illinois', 'USA'),
('K', 'Ford', 'Louisville, Kentucky', 'USA'),
('R', 'Ford', 'Hermosillo, Mexico', 'Mexico'),
-- GM
('C', 'Chevrolet', 'Spring Hill, Tennessee', 'USA'),
('G', 'Chevrolet', 'Oshawa, Ontario', 'Canada'),
('K', 'Chevrolet', 'Lordstown, Ohio', 'USA'),
('W', 'Chevrolet', 'Wentzville, Missouri', 'USA'),
('1', 'Chevrolet', 'Silao, Mexico', 'Mexico'),
-- Tesla
('F', 'Tesla', 'Fremont, California', 'USA'),
('A', 'Tesla', 'Austin, Texas', 'USA'),
-- BMW
('A', 'BMW', 'Munich, Germany', 'Germany'),
('B', 'BMW', 'Dingolfing, Germany', 'Germany'),
('U', 'BMW', 'Spartanburg, South Carolina', 'USA'),
-- Mercedes
('A', 'Mercedes-Benz', 'Stuttgart, Germany', 'Germany'),
('W', 'Mercedes-Benz', 'Vance, Alabama', 'USA'),
-- VW
('M', 'Volkswagen', 'Puebla, Mexico', 'Mexico'),
('W', 'Volkswagen', 'Wolfsburg, Germany', 'Germany'),
('G', 'Volkswagen', 'Chattanooga, Tennessee', 'USA')
ON CONFLICT (plant_char, manufacturer) DO NOTHING;

-- 4. Vehicle descriptor section (VDS) - indicates model characteristics
-- This varies by manufacturer, but we can create a basic lookup
CREATE TABLE IF NOT EXISTS vds_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wmi VARCHAR(3) NOT NULL,
    vds_pattern VARCHAR(8) NOT NULL, -- characters 4-9 of VIN
    vehicle_type VARCHAR(50),
    engine_type VARCHAR(50),
    body_style VARCHAR(50),
    model_line VARCHAR(100),
    UNIQUE(wmi, vds_pattern)
);

-- 5. Comprehensive VIN decoder function
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
    v_year_rec vin_year_codes%ROWTYPE;
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
    
    -- Look up year (need to determine correct decade)
    -- VIN year codes repeat every 30 years, so we need to infer decade
    SELECT * INTO v_year_rec FROM vin_year_codes WHERE year_char = v_year_char;
    
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
        'year_char', v_year_char,
        'year_start', v_year_rec.year_start,
        'year_end', v_year_rec.year_end,
        'plant_char', v_plant_char,
        'plant_name', v_plant_rec.plant_name,
        'plant_country', v_plant_rec.country,
        'serial_number', v_serial
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to find matching cars in database from decoded VIN
CREATE OR REPLACE FUNCTION find_car_by_vin_decoded(p_vin VARCHAR(17))
RETURNS TABLE (
    id UUID,
    year INTEGER,
    make VARCHAR,
    model VARCHAR,
    "trim" VARCHAR,
    vehicle_type vehicle_type,
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    match_confidence VARCHAR(20)
) AS $$
DECLARE
    v_decoded JSONB;
    v_make VARCHAR;
    v_year INTEGER;
    v_year_start INTEGER;
    v_year_end INTEGER;
BEGIN
    -- Decode VIN
    v_decoded := decode_vin_complete(p_vin);
    
    IF v_decoded ? 'error' THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::vehicle_type, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, 'error'::VARCHAR;
        RETURN;
    END IF;
    
    v_make := v_decoded->>'manufacturer';
    v_year_start := (v_decoded->>'year_start')::INTEGER;
    v_year_end := (v_decoded->>'year_end')::INTEGER;
    
    -- Try exact match first (within year range from VIN)
    RETURN QUERY 
    SELECT 
        c.id, 
        c.year, 
        c.make, 
        c.model, 
        c.trim,
        c.vehicle_type,
        c.length_mm,
        c.width_mm,
        c.height_mm,
        'high'::VARCHAR as match_confidence
    FROM cars c
    WHERE UPPER(c.make) = UPPER(v_make)
        AND c.year BETWEEN v_year_start AND v_year_end
    LIMIT 1;
    
END;
$$ LANGUAGE plpgsql;