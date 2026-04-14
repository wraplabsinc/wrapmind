-- Add wholesale_price to wrap_materials

ALTER TABLE wrap_materials ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10,2);

-- Update existing materials with wholesale prices (typically 40% below retail)
UPDATE wrap_materials SET wholesale_price = ROUND(price_per_sqft * 0.60, 2)
WHERE category = 'vinyl_calendared';

UPDATE wrap_materials SET wholesale_price = ROUND(price_per_sqft * 0.65, 2)
WHERE category IN ('vinyl_cast', 'specialty');

UPDATE wrap_materials SET wholesale_price = ROUND(price_per_sqft * 0.70, 2)
WHERE category = 'ppf';

-- Update the XPEL products I just added
UPDATE wrap_materials SET wholesale_price = ROUND(price_per_sqft * 0.70, 2)
WHERE code LIKE 'XPEL%';

-- Add remaining XPEL products wholesale prices
INSERT INTO wrap_materials (name, code, category, price_per_sqft, wholesale_price, durability_years, warranty_years, description) VALUES
-- XPEL Ultimate Plus Series
('XPEL Ultimate Plus', 'XPEL-UP', 'ppf', 14.99, 10.49, 10, 10, 'XPEL Ultimate Plus - Standard clear PPF'),
('XPEL Ultimate Plus Black', 'XPEL-UP-BLK', 'ppf', 16.99, 11.89, 10, 10, 'XPEL Ultimate Plus Black - Satin black finish'),
('XPEL Ultimate Plus Luminance', 'XPEL-UP-LUM', 'ppf', 17.99, 12.59, 12, 12, 'XPEL Ultimate Plus Luminance - Enhanced clarity'),
-- XPEL Lux Series  
('XPEL Lux', 'XPEL-LUX', 'ppf', 18.99, 13.29, 10, 10, 'XPEL Lux - Premium clear PPF'),
('XPEL Lux Noir', 'XPEL-LUX-NR', 'ppf', 19.99, 13.99, 10, 10, 'XPEL Lux Noir - Matte black PPF'),
('XPEL Lux Max', 'XPEL-LUX-MAX', 'ppf', 21.99, 15.39, 12, 12, 'XPEL Lux Max - Maximum protection'),
-- XPEL Stealth
('XPEL Stealth', 'XPEL-STLTH', 'ppf', 19.99, 13.99, 10, 10, 'XPEL Stealth - Matte finish PPF'),
('XPEL Stealth Luminance', 'XPEL-STLTH-LUM', 'ppf', 22.99, 16.09, 12, 12, 'XPEL Stealth Luminance - Matte with clarity'),
-- XPEL Prime Series
('XPEL Prime CS', 'XPEL-PRIME-CS', 'ppf', 9.99, 6.99, 7, 7, 'XPEL Prime CS - Ceramic substrate'),
('XPEL Prime XR', 'XPEL-PRIME-XR', 'ppf', 11.99, 8.39, 8, 8, 'XPEL Prime XR - Ceramic with IR rejection'),
('XPEL Prime XTR', 'XPEL-PRIME-XTR', 'ppf', 13.99, 9.79, 9, 9, 'XPEL Prime XTR - Maximum IR rejection'),
-- XPEL Apex Series
('XPEL Apex', 'XPEL-APEX', 'ppf', 24.99, 17.49, 12, 12, 'XPEL Apex - Top of the line ceramic PPF'),
('XPEL Apex Stealth', 'XPEL-APEX-STLTH', 'ppf', 26.99, 18.89, 12, 12, 'XPEL Apex Stealth - Ceramic matte finish')
ON CONFLICT (code) DO UPDATE SET
    wholesale_price = EXCLUDED.wholesale_price;

-- Verify
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM wrap_materials WHERE wholesale_price IS NOT NULL;
    RAISE NOTICE 'Materials with wholesale_price: %', v_count;
END $$;