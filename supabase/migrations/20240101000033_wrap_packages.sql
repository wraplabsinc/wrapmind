-- Wrap Shop Package Management Tables

-- Material types with base pricing
CREATE TABLE IF NOT EXISTS wrap_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'vinyl_cast', 'vinyl_calendared', 'ppf', 'specialty'
    price_per_sqft DECIMAL(10,2) NOT NULL,
    durability_years INTEGER,
    warranty_years INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common wrap materials
INSERT INTO wrap_materials (name, code, category, price_per_sqft, durability_years, warranty_years, description) VALUES
-- Cast Vinyl (premium, long-lasting)
('3M 2080 Gloss', '3M-2080-GLOSS', 'vinyl_cast', 18.99, 8, 5, '3M 2080 Cast Vinyl Gloss'),
('3M 2080 Matte', '3M-2080-MATTE', 'vinyl_cast', 19.99, 8, 5, '3M 2080 Cast Vinyl Matte'),
('3M 2080 Satin', '3M-2080-SATIN', 'vinyl_cast', 19.99, 8, 5, '3M 2080 Cast Vinyl Satin'),
('Avery Dennison SW900', 'AVY-SW900-GLOSS', 'vinyl_cast', 16.99, 7, 5, 'Avery Dennison Supreme Wrap'),
('Avery Dennison ColorFlow', 'AVY-COLORFLOW', 'vinyl_cast', 24.99, 7, 5, 'Avery Dennison ColorFlow Series'),
('Oracal 970 Premium Cast', 'ORC-970-GLOSS', 'vinyl_cast', 14.99, 7, 5, 'Oracal 970 Premium Cast Series'),
('Hexis C16000', 'HEX-C16000', 'vinyl_cast', 13.99, 6, 4, 'Hexis C16000 Cast Vinyl'),

-- Calendared Vinyl (economy)
('Oracal 651', 'ORC-651-GLOSS', 'vinyl_calendared', 6.99, 3, 1, 'Oracal 651 Intermediate'),
('Avery Dennison 500', 'AVY-500-GLOSS', 'vinyl_calendared', 7.99, 3, 1, 'Avery Dennison 500 Series'),
('Kaiflex K700', 'KAIFLEX-K700', 'vinyl_calendared', 5.99, 2, 1, 'Kaiflex K700 Economy'),

-- Paint Protection Film (PPF)
('3M Scotchgard Pro', '3M-SGP-PPF', 'ppf', 12.99, 10, 10, '3M Scotchgard Pro PPF'),
('XPEL Ultimate Plus', 'XPEL-UP', 'ppf', 14.99, 10, 10, 'XPEL Ultimate Plus'),
('SunTek Ultra', 'SUNTEK-ULTRA', 'ppf', 13.99, 10, 10, 'SunTek Ultra'),
('Llumar Platinum', 'LLumar-PT', 'ppf', 11.99, 8, 8, 'Llumar Platinum Series'),

-- Specialty Materials
('3M Di-Noc Carbon Fiber', '3M-DINOC-CF', 'specialty', 32.99, 5, 3, '3M Di-Noc Carbon Fiber'),
('Avery Dennison Hammerhead', 'AVY-HH', 'specialty', 28.99, 5, 3, 'Avery Dennison Hammerhead'),
('Spandex Chrome', 'SPX-CHROME', 'specialty', 35.99, 3, 1, 'Spandex Chrome Vinyl'),
('KPMF Imperial Chrome', 'KPMF-CHROME', 'specialty', 34.99, 3, 1, 'KPMF Imperial Chrome')
ON CONFLICT (code) DO NOTHING;

-- Wrap package definitions
CREATE TABLE IF NOT EXISTS wrap_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    coverage_area JSONB NOT NULL, -- e.g., {"parts": ["hood", "roof", "fenders"], "percentage": 60}
    labor_hours DECIMAL(6,2) NOT NULL,
    labor_rate_per_hour DECIMAL(10,2) DEFAULT 75.00,
    base_cost DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common packages
INSERT INTO wrap_packages (name, code, description, coverage_area, labor_hours, labor_rate_per_hour, sort_order) VALUES
-- Full Vehicle Wraps
('Full Wrap - Complete', 'FULL-COMPLETE', 'Complete vehicle wrap including all body panels', 
 '{"parts": ["hood", "roof", "doors", "fenders", "bumpers", "mirrors"], "percentage": 100}', 
 12.0, 75.00, 1),

('Full Wrap - Excluding Roof', 'FULL-NO-ROOF', 'Full wrap excluding roof (for sunroofs)', 
 '{"parts": ["hood", "doors", "fenders", "bumpers", "mirrors"], "percentage": 90}', 
 10.0, 75.00, 2),

('Full Wrap - Color Change', 'FULL-COLOR', 'Complete color change wrap', 
 '{"parts": ["hood", "roof", "doors", "fenders", "bumpers", "mirrors", "trunk"], "percentage": 100}', 
 14.0, 85.00, 3),

-- Partial Wraps
('Hood Wrap', 'PART-HOOD', 'Hood only wrap', 
 '{"parts": ["hood"], "percentage": 15}', 
 1.5, 75.00, 10),

('Roof Wrap', 'PART-ROOF', 'Roof only wrap', 
 '{"parts": ["roof"], "percentage": 15}', 
 1.5, 75.00, 11),

('Hood + Mirrors', 'PART-HOOD-MIRRORS', 'Hood and side mirrors', 
 '{"parts": ["hood", "mirrors"], "percentage": 20}', 
 2.0, 75.00, 12),

('Roof + Pillars', 'PART-ROOF-PILLARS', 'Roof and A/B/C pillars', 
 '{"parts": ["roof", "pillars"], "percentage": 20}', 
 2.5, 75.00, 13),

('Fenders (Front)', 'PART-FENDERS-FRONT', 'Both front fenders', 
 '{"parts": ["front_fender_left", "front_fender_right"], "percentage": 10}', 
 2.0, 75.00, 14),

-- Accent Packages
('Accent - Racing Stripes', 'ACCENT-STRIPES', 'Dual racing stripes hood and roof', 
 '{"parts": ["hood_stripes", "roof_stripes"], "percentage": 8}', 
 3.0, 65.00, 20),

('Accent - Mirror Wrap', 'ACCENT-MIRRORS', 'Side mirrors only', 
 '{"parts": ["mirror_left", "mirror_right"], "percentage": 3}', 
 0.5, 75.00, 21),

('Accent - Bumper Inserts', 'ACCENT-BUMPERS', 'Front and rear bumper accents', 
 '{"parts": ["front_bumper_accent", "rear_bumper_accent"], "percentage": 5}', 
 1.0, 65.00, 22),

-- Commercial Packages
('Commercial - Full Van', 'COMM-VAN-FULL', 'Complete van advertising wrap', 
 '{"parts": ["hood", "roof", "doors", "fenders", "bumpers", "sides", "rear"], "percentage": 100}', 
 18.0, 70.00, 30),

('Commercial - Truck Side', 'COMM-TRUCK-SIDE', 'Truck side advertising panel', 
 '{"parts": ["doors", "fenders"], "percentage": 45}', 
 6.0, 65.00, 31),

('Commercial - Delivery Box', 'COMM-BOX', 'Delivery box complete wrap', 
 '{"parts": ["box_all"], "percentage": 100}', 
 8.0, 60.00, 32),

-- PPF Packages  
('PPF - Front End', 'PPF-FRONT', 'Front bumper, hood, and fenders', 
 '{"parts": ["hood", "front_fender_left", "front_fender_right", "front_bumper"], "percentage": 35}', 
 6.0, 95.00, 40),

('PPF - Full Hood', 'PPF-HOOD', 'Complete hood protection', 
 '{"parts": ["hood"], "percentage": 15}', 
 2.5, 95.00, 41),

('PPF - Mirror Caps', 'PPF-MIRRORS', 'Both mirror caps', 
 '{"parts": ["mirror_left", "mirror_right"], "percentage": 3}', 
 1.0, 85.00, 42)
ON CONFLICT (code) DO NOTHING;

-- Package + Material compatibility (which materials can be used with which packages)
CREATE TABLE IF NOT EXISTS package_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES wrap_packages(id),
    material_id UUID NOT NULL REFERENCES wrap_materials(id),
    material_multiplier DECIMAL(4,2) DEFAULT 1.00, -- price multiplier for this combo
    UNIQUE(package_id, material_id)
);

-- Insert common combinations
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 
    CASE 
        WHEN m.category = 'vinyl_cast' THEN 1.00
        WHEN m.category = 'vinyl_calendared' THEN 0.50
        WHEN m.category = 'ppf' THEN 2.50
        WHEN m.category = 'specialty' THEN 1.75
    END
FROM wrap_packages p, wrap_materials m
WHERE p.code LIKE 'FULL-%' AND m.code LIKE '3M%'
ON CONFLICT DO NOTHING;

-- Insert PPF package materials
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 1.00
FROM wrap_packages p, wrap_materials m
WHERE p.code LIKE 'PPF-%' AND m.category = 'ppf'
ON CONFLICT DO NOTHING;

-- Insert accent package materials (cheaper options)
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 
    CASE WHEN m.category = 'vinyl_calendared' THEN 0.75 ELSE 1.00 END
FROM wrap_packages p, wrap_materials m
WHERE p.code LIKE 'ACCENT-%'
ON CONFLICT DO NOTHING;

-- Vehicle size class multipliers for pricing
CREATE TABLE IF NOT EXISTS vehicle_size_multipliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type vehicle_type NOT NULL,
    size_class VARCHAR(20) NOT NULL, -- 'subcompact', 'compact', 'midsize', 'fullsize', 'large'
    size_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    UNIQUE(vehicle_type, size_class)
);

INSERT INTO vehicle_size_multipliers (vehicle_type, size_class, size_multiplier) VALUES
-- Sedan multipliers
('sedan', 'subcompact', 0.85),
('sedan', 'compact', 0.90),
('sedan', 'midsize', 1.00),
('sedan', 'fullsize', 1.15),
('sedan', 'luxury', 1.25),

-- SUV multipliers
('suv', 'subcompact', 0.95),
('suv', 'compact', 1.00),
('suv', 'midsize', 1.15),
('suv', 'fullsize', 1.30),
('suv', 'three_row', 1.45),

-- Truck multipliers
('truck', 'compact', 1.00),
('truck', 'half_ton', 1.20),
('truck', 'three_quarter_ton', 1.40),
('truck', 'heavy_duty', 1.60),

-- Van multipliers
('van', 'compact', 1.00),
('van', 'fullsize', 1.30),
('van', 'minivan', 1.15),

-- Coupe multipliers
('coupe', 'subcompact', 0.80),
('coupe', 'compact', 0.85),
('coupe', 'midsize', 0.95),
('coupe', 'sports', 1.00),
('coupe', 'exotic', 1.20),

-- Hatchback multipliers
('hatchback', 'subcompact', 0.85),
('hatchback', 'compact', 0.90),
('hatchback', 'midsize', 1.00),

-- Wagon multipliers
('wagon', 'compact', 0.95),
('wagon', 'midsize', 1.05),
('wagon', 'fullsize', 1.20),

-- Crossover (similar to SUV)
('crossover', 'subcompact', 0.90),
('crossover', 'compact', 1.00),
('crossover', 'midsize', 1.10)
ON CONFLICT DO NOTHING;

-- Get size class for a car based on dimensions
CREATE OR REPLACE FUNCTION get_vehicle_size_class(p_length_mm INTEGER, p_vehicle_type vehicle_type)
RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN CASE 
        WHEN p_vehicle_type IN ('coupe', 'hatchback') THEN
            CASE 
                WHEN p_length_mm < 4400 THEN 'subcompact'
                WHEN p_length_mm < 4700 THEN 'compact'
                WHEN p_length_mm < 4900 THEN 'midsize'
                ELSE 'sports'
            END
        WHEN p_vehicle_type = 'sedan' THEN
            CASE 
                WHEN p_length_mm < 4500 THEN 'subcompact'
                WHEN p_length_mm < 4700 THEN 'compact'
                WHEN p_length_mm < 5000 THEN 'midsize'
                WHEN p_length_mm < 5200 THEN 'fullsize'
                ELSE 'luxury'
            END
        WHEN p_vehicle_type IN ('suv', 'crossover') THEN
            CASE 
                WHEN p_length_mm < 4400 THEN 'subcompact'
                WHEN p_length_mm < 4700 THEN 'compact'
                WHEN p_length_mm < 5000 THEN 'midsize'
                WHEN p_length_mm < 5200 THEN 'fullsize'
                ELSE 'three_row'
            END
        WHEN p_vehicle_type = 'truck' THEN
            CASE 
                WHEN p_length_mm < 5400 THEN 'compact'
                WHEN p_length_mm < 5800 THEN 'half_ton'
                WHEN p_length_mm < 6200 THEN 'three_quarter_ton'
                ELSE 'heavy_duty'
            END
        WHEN p_vehicle_type = 'van' THEN
            CASE 
                WHEN p_length_mm < 5000 THEN 'compact'
                WHEN p_length_mm < 5200 THEN 'minivan'
                ELSE 'fullsize'
            END
        ELSE 'midsize'
    END;
END;
$$ LANGUAGE plpgsql;

-- Calculate package price for a specific car
CREATE OR REPLACE FUNCTION calculate_package_price(
    p_package_id UUID,
    p_car_id UUID,
    p_material_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_package RECORD;
    v_car RECORD;
    v_material RECORD;
    v_material_row RECORD;
    v_size_class VARCHAR(20);
    v_size_multiplier DECIMAL(10,2);
    v_wrap_sqft DECIMAL(10,2);
    v_material_cost DECIMAL(10,2);
    v_labor_cost DECIMAL(10,2);
    v_base_cost DECIMAL(10,2);
    v_total_cost DECIMAL(10,2);
    v_coverage_pct INTEGER;
BEGIN
    -- Get package info
    SELECT * INTO v_package FROM wrap_packages WHERE id = p_package_id AND is_active = true;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Package not found');
    END IF;
    
    -- Get car info
    SELECT * INTO v_car FROM cars WHERE id = p_car_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Car not found');
    END IF;
    
    -- Determine size class
    v_size_class := get_vehicle_size_class(v_car.length_mm, v_car.vehicle_type);
    
    -- Get size multiplier
    SELECT size_multiplier INTO v_size_multiplier
    FROM vehicle_size_multipliers
    WHERE vehicle_type = v_car.vehicle_type AND size_class = v_size_class;
    
    IF v_size_multiplier IS NULL THEN
        v_size_multiplier := 1.00;
    END IF;
    
    -- Get wrap coverage (sq ft) for this car
    v_wrap_sqft := ((calculate_wrap_from_body_parts(v_car.body_parts)->>'total_sq_feet')::DECIMAL * 
        (v_package.coverage_area->>'percentage')::INTEGER / 100);
    
    -- Determine material
    IF p_material_id IS NOT NULL THEN
        SELECT * INTO v_material FROM wrap_materials WHERE id = p_material_id AND is_active = true;
    ELSE
        -- Get default material for package (cheapest compatible)
        SELECT m.* INTO v_material
        FROM package_materials pm
        JOIN wrap_materials m ON m.id = pm.material_id
        WHERE pm.package_id = p_package_id
        ORDER BY m.price_per_sqft ASC
        LIMIT 1;
    END IF;
    
    -- Get material multiplier for this package/material combo
    SELECT material_multiplier INTO v_material_row
    FROM package_materials
    WHERE package_id = p_package_id AND material_id = v_material.id;
    
    -- Calculate costs
    v_material_cost := v_wrap_sqft * v_material.price_per_sqft * 
        COALESCE(v_material_row.material_multiplier, 1.00);
    
    v_labor_cost := v_package.labor_hours * v_package.labor_rate_per_hour;
    v_base_cost := v_package.base_cost;
    
    v_total_cost := (v_material_cost + v_labor_cost + v_base_cost) * v_size_multiplier;
    
    RETURN jsonb_build_object(
        'package_name', v_package.name,
        'package_code', v_package.code,
        'material_name', v_material.name,
        'material_code', v_material.code,
        'vehicle', jsonb_build_object(
            'year', v_car.year,
            'make', v_car.make,
            'model', v_car.model,
            'vehicle_type', v_car.vehicle_type,
            'size_class', v_size_class
        ),
        'calculations', jsonb_build_object(
            'coverage_percentage', v_package.coverage_area->>'percentage',
            'wrap_sqft', ROUND(v_wrap_sqft, 2),
            'material_cost', ROUND(v_material_cost, 2),
            'labor_hours', v_package.labor_hours,
            'labor_cost', ROUND(v_labor_cost, 2),
            'base_cost', ROUND(v_base_cost, 2),
            'size_multiplier', v_size_multiplier
        ),
        'pricing', jsonb_build_object(
            'material_cost', ROUND(v_material_cost * v_size_multiplier, 2),
            'labor_cost', ROUND(v_labor_cost * v_size_multiplier, 2),
            'total_cost', ROUND(v_total_cost, 2),
            'total_cost_with_margin', ROUND(v_total_cost * 1.30, 2) -- 30% margin
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Get available packages for a vehicle type
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
        ROUND(250.00 * (p.coverage_area->>'percentage')::INTEGER / 100, 2) as estimated_sqft, -- assumes avg 250 sqft vehicle
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

-- Get all materials
CREATE OR REPLACE FUNCTION get_wrap_materials(p_category VARCHAR DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    code VARCHAR,
    category VARCHAR(50),
    price_per_sqft DECIMAL,
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
        m.durability_years,
        m.warranty_years,
        m.description
    FROM wrap_materials m
    WHERE m.is_active = true
        AND (p_category IS NULL OR m.category = p_category)
    ORDER BY m.category, m.price_per_sqft;
END;
$$ LANGUAGE plpgsql;