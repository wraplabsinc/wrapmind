-- Add all XPEL PPF product lines

INSERT INTO wrap_materials (name, code, category, price_per_sqft, durability_years, warranty_years, description) VALUES
-- XPEL Ultimate Plus Series
('XPEL Ultimate Plus', 'XPEL-UP', 'ppf', 14.99, 10, 10, 'XPEL Ultimate Plus - Standard clear PPF'),
('XPEL Ultimate Plus Black', 'XPEL-UP-BLK', 'ppf', 16.99, 10, 10, 'XPEL Ultimate Plus Black - Satin black finish'),
('XPEL Ultimate Plus Luminance', 'XPEL-UP-LUM', 'ppf', 17.99, 12, 12, 'XPEL Ultimate Plus Luminance - Enhanced clarity'),

-- XPEL Lux Series  
('XPEL Lux', 'XPEL-LUX', 'ppf', 18.99, 10, 10, 'XPEL Lux - Premium clear PPF'),
('XPEL Lux Noir', 'XPEL-LUX-NR', 'ppf', 19.99, 10, 10, 'XPEL Lux Noir - Matte black PPF'),
('XPEL Lux Max', 'XPEL-LUX-MAX', 'ppf', 21.99, 12, 12, 'XPEL Lux Max - Maximum protection'),

-- XPEL Stealth (Matte/Satin finishes)
('XPEL Stealth', 'XPEL-STLTH', 'ppf', 19.99, 10, 10, 'XPEL Stealth - Matte finish PPF'),
('XPEL Stealth Luminance', 'XPEL-STLTH-LUM', 'ppf', 22.99, 12, 12, 'XPEL Stealth Luminance - Matte with clarity'),

-- XPEL Prime Series
('XPEL Prime CS', 'XPEL-PRIME-CS', 'ppf', 9.99, 7, 7, 'XPEL Prime CS - Ceramic substrate'),
('XPEL Prime XR', 'XPEL-PRIME-XR', 'ppf', 11.99, 8, 8, 'XPEL Prime XR - Ceramic with IR rejection'),
('XPEL Prime XTR', 'XPEL-PRIME-XTR', 'ppf', 13.99, 9, 9, 'XPEL Prime XTR - Maximum IR rejection'),

-- XPEL Apex Series
('XPEL Apex', 'XPEL-APEX', 'ppf', 24.99, 12, 12, 'XPEL Apex - Top of the line ceramic PPF'),
('XPEL Apex Stealth', 'XPEL-APEX-STLTH', 'ppf', 26.99, 12, 12, 'XPEL Apex Stealth - Ceramic matte finish')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM wrap_materials WHERE code LIKE 'XPEL%';
    RAISE NOTICE 'XPEL products now: %', v_count;
END $$;