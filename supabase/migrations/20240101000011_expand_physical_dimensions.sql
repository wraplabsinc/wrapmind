-- Migration: Add dimension_references table and update car dimensions
-- Provides realistic physical dimensions based on vehicle type and class

-- Create dimension_references table
CREATE TABLE IF NOT EXISTS dimension_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type vehicle_type NOT NULL,
    size_class VARCHAR(50) NOT NULL, -- e.g., 'subcompact', 'compact', 'midsize', 'fullsize', 'large'
    make VARCHAR(100),
    model VARCHAR(100),
    year_start INTEGER,
    year_end INTEGER,
    length_mm INTEGER NOT NULL,
    width_mm INTEGER NOT NULL,
    height_mm INTEGER NOT NULL,
    wheelbase_mm INTEGER NOT NULL,
    ground_clearance_mm INTEGER,
    curb_weight_kg DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_ref_lookup 
ON dimension_references(vehicle_type, size_class, make, model, year_start);

-- Insert industry-average dimensions by vehicle type and size class
INSERT INTO dimension_references (vehicle_type, size_class, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Coupe averages
('coupe', 'subcompact', 4400, 1750, 1350, 2650, 130, 1400),
('coupe', 'compact', 4600, 1800, 1380, 2750, 140, 1550),
('coupe', 'midsize', 4850, 1850, 1400, 2850, 145, 1700),
('coupe', 'fullsize', 5100, 1950, 1450, 3000, 150, 1900),
('coupe', 'sports', 4600, 1850, 1300, 2750, 120, 1600),
('coupe', 'exotic', 4500, 1950, 1200, 2700, 100, 1500),

-- Sedan averages
('sedan', 'subcompact', 4500, 1700, 1450, 2650, 150, 1300),
('sedan', 'compact', 4650, 1800, 1470, 2750, 155, 1450),
('sedan', 'midsize', 4900, 1850, 1480, 2850, 160, 1600),
('sedan', 'fullsize', 5100, 1900, 1500, 3050, 165, 1800),
('sedan', 'luxury', 5200, 1950, 1520, 3100, 170, 2000),

-- SUV averages
('suv', 'subcompact', 4200, 1800, 1650, 2600, 180, 1500),
('suv', 'compact', 4500, 1850, 1680, 2700, 185, 1700),
('suv', 'midsize', 4800, 1950, 1750, 2850, 200, 2000),
('suv', 'fullsize', 5100, 2050, 1850, 3050, 210, 2400),
('suv', 'three_row', 5200, 2100, 1900, 3150, 200, 2500),

-- Truck averages (pickup)
('truck', 'compact', 5300, 1900, 1800, 3250, 220, 2000),
('truck', 'half_ton', 5700, 2000, 1900, 3500, 230, 2400),
('truck', 'three_quarter_ton', 6000, 2100, 2000, 3800, 250, 3000),
('truck', 'heavy_duty', 6500, 2200, 2100, 4100, 280, 3500),

-- Van averages
('van', 'compact', 4800, 1900, 1800, 3000, 170, 1800),
('van', 'fullsize', 5400, 2050, 2050, 3300, 180, 2500),
('van', 'minivan', 5100, 2000, 1750, 3050, 160, 2100),

-- Hatchback averages
('hatchback', 'subcompact', 4000, 1700, 1500, 2550, 150, 1200),
('hatchback', 'compact', 4300, 1800, 1530, 2650, 155, 1350),
('hatchback', 'midsize', 4600, 1850, 1560, 2800, 160, 1500),

-- Wagon averages
('wagon', 'compact', 4700, 1800, 1550, 2850, 160, 1600),
('wagon', 'midsize', 4900, 1850, 1600, 2950, 165, 1750),
('wagon', 'fullsize', 5200, 1950, 1650, 3100, 170, 2000),

-- Crossover averages (similar to SUV but car-based platform)
('crossover', 'subcompact', 4300, 1800, 1650, 2650, 175, 1550),
('crossover', 'compact', 4600, 1850, 1700, 2800, 180, 1750),
('crossover', 'midsize', 4900, 1950, 1750, 2950, 190, 2000),

-- Convertible (based on coupe dimensions but lower)
('convertible', 'sports', 4500, 1850, 1350, 2750, 120, 1650),
('convertible', 'luxury', 4900, 1900, 1400, 2900, 130, 1900);

-- Add specific make/model overrides for common vehicles
-- These provide more accurate dimensions for popular models

-- Toyota
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Toyota', 'Camry', 2018, 2024, 4875, 1840, 1445, 2825, 155, 1595),
('sedan', 'midsize', 'Toyota', 'Avalon', 2018, 2024, 4975, 1850, 1435, 2870, 145, 1660),
('suv', 'compact', 'Toyota', 'RAV4', 2019, 2024, 4600, 1855, 1685, 2690, 195, 1700),
('suv', 'midsize', 'Toyota', 'Highlander', 2020, 2024, 4950, 1930, 1730, 2850, 205, 2085),
('suv', 'three_row', 'Toyota', 'Sequoia', 2023, 2024, 5210, 2030, 1895, 3050, 210, 2585),
('truck', 'half_ton', 'Toyota', 'Tundra', 2022, 2024, 5930, 2030, 1920, 3700, 235, 2585),
('hatchback', 'compact', 'Toyota', 'Corolla', 2019, 2024, 4630, 1780, 1435, 2700, 145, 1320);

-- Honda
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Honda', 'Civic', 2022, 2024, 4650, 1800, 1415, 2735, 145, 1350),
('sedan', 'midsize', 'Honda', 'Accord', 2018, 2024, 4870, 1855, 1440, 2830, 145, 1490),
('suv', 'compact', 'Honda', 'CR-V', 2020, 2024, 4690, 1865, 1685, 2700, 185, 1650),
('suv', 'midsize', 'Honda', 'Pilot', 2023, 2024, 5060, 1994, 1803, 2819, 185, 2030);

-- Ford
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Ford', 'Mustang', 2018, 2024, 4790, 1915, 1375, 2720, 140, 1680),
('suv', 'compact', 'Ford', 'Bronco Sport', 2021, 2024, 4385, 1925, 1745, 2670, 200, 1750),
('suv', 'midsize', 'Ford', 'Explorer', 2020, 2024, 5050, 2005, 1775, 3025, 200, 1975),
('suv', 'three_row', 'Ford', 'Expedition', 2023, 2024, 5330, 2030, 1935, 3110, 250, 2560),
('truck', 'half_ton', 'Ford', 'F-150', 2021, 2024, 5890, 2030, 1915, 3685, 240, 2150),
('truck', 'half_ton', 'Ford', 'Ranger', 2019, 2024, 5355, 1865, 1815, 3220, 230, 1975);

-- Chevrolet
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Chevrolet', 'Malibu', 2016, 2024, 4925, 1855, 1450, 2835, 145, 1525),
('suv', 'compact', 'Chevrolet', 'Equinox', 2018, 2024, 4660, 1845, 1660, 2725, 180, 1680),
('suv', 'midsize', 'Chevrolet', 'Traverse', 2018, 2024, 5185, 1995, 1795, 3070, 185, 1970),
('suv', 'three_row', 'Chevrolet', 'Suburban', 2021, 2024, 5720, 2060, 1925, 3405, 230, 2600),
('truck', 'half_ton', 'Chevrolet', 'Silverado 1500', 2019, 2024, 5885, 2030, 1880, 3745, 235, 2150),
('coupe', 'sports', 'Chevrolet', 'Corvette', 2020, 2024, 4610, 1935, 1225, 2725, 100, 1565);

-- BMW
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'BMW', '3 Series', 2019, 2024, 4715, 1825, 1445, 2850, 140, 1600),
('sedan', 'midsize', 'BMW', '5 Series', 2018, 2024, 4965, 1870, 1480, 2975, 145, 1750),
('sedan', 'luxury', 'BMW', '7 Series', 2019, 2024, 5260, 1950, 1535, 3210, 150, 2050),
('suv', 'compact', 'BMW', 'X3', 2018, 2024, 4715, 1895, 1685, 2865, 195, 1850),
('suv', 'midsize', 'BMW', 'X5', 2019, 2024, 4935, 2005, 1775, 2975, 210, 2175),
('suv', 'three_row', 'BMW', 'X7', 2019, 2024, 5185, 2005, 1835, 3105, 220, 2450);

-- Mercedes-Benz
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Mercedes-Benz', 'C-Class', 2018, 2024, 4750, 1820, 1435, 2840, 145, 1650),
('sedan', 'luxury', 'Mercedes-Benz', 'E-Class', 2018, 2024, 4940, 1855, 1460, 2940, 150, 1800),
('sedan', 'fullsize', 'Mercedes-Benz', 'S-Class', 2018, 2024, 5255, 1895, 1495, 3165, 155, 2100),
('suv', 'compact', 'Mercedes-Benz', 'GLC', 2019, 2024, 4715, 1890, 1645, 2875, 190, 1850),
('suv', 'midsize', 'Mercedes-Benz', 'GLE', 2020, 2024, 4940, 1955, 1715, 2995, 200, 2150),
('suv', 'three_row', 'Mercedes-Benz', 'GLS', 2020, 2024, 5210, 1955, 1825, 3135, 215, 2450);

-- Tesla
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Tesla', 'Model 3', 2018, 2024, 4690, 1850, 1445, 2875, 140, 1735),
('sedan', 'midsize', 'Tesla', 'Model S', 2021, 2024, 4970, 1965, 1445, 2960, 140, 2065),
('suv', 'compact', 'Tesla', 'Model Y', 2020, 2024, 4750, 1920, 1625, 2890, 165, 2005),
('suv', 'midsize', 'Tesla', 'Model X', 2021, 2024, 5050, 1995, 1685, 2965, 165, 2355);

-- Create function to get dimension reference
CREATE OR REPLACE FUNCTION get_dimension_reference(
    p_vehicle_type vehicle_type,
    p_make VARCHAR,
    p_model VARCHAR,
    p_year INTEGER
)
RETURNS dimension_references AS $$
DECLARE
    v_result dimension_references%ROWTYPE;
BEGIN
    -- First try exact make/model match with year range
    SELECT * INTO v_result
    FROM dimension_references
    WHERE make = p_make 
        AND model = p_model
        AND year_start <= p_year 
        AND year_end >= p_year
    LIMIT 1;
    
    -- If not found, try generic type/size_class
    IF NOT FOUND THEN
        SELECT * INTO v_result
        FROM dimension_references
        WHERE vehicle_type = p_vehicle_type
            AND make IS NULL
            AND model IS NULL
        ORDER BY size_class = 'midsize' DESC
        LIMIT 1;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update function to apply dimensions to a single car
CREATE OR REPLACE FUNCTION update_car_dimensions(p_car_id UUID)
RETURNS VOID AS $$
DECLARE
    v_car RECORD;
    v_dim dimension_references%ROWTYPE;
BEGIN
    -- Get car details
    SELECT * INTO v_car FROM cars WHERE id = p_car_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get dimension reference
    v_dim := get_dimension_reference(v_car.vehicle_type, v_car.make, v_car.model, v_car.year);
    
    -- Update car dimensions if found
    IF v_dim.id IS NOT NULL THEN
        UPDATE cars SET
            length_mm = v_dim.length_mm,
            width_mm = v_dim.width_mm,
            height_mm = v_dim.height_mm,
            wheelbase_mm = v_dim.wheelbase_mm,
            ground_clearance_mm = v_dim.ground_clearance_mm,
            curb_weight_kg = v_dim.curb_weight_kg
        WHERE id = p_car_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create batch update function for efficiency
CREATE OR REPLACE FUNCTION update_all_car_dimensions()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
    v_count INTEGER := 0;
    v_car RECORD;
    v_dim dimension_references%ROWTYPE;
BEGIN
    FOR v_car IN SELECT id, vehicle_type, make, model, year FROM cars LOOP
        v_dim := get_dimension_reference(v_car.vehicle_type, v_car.make, v_car.model, v_car.year);
        
        IF v_dim.id IS NOT NULL THEN
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