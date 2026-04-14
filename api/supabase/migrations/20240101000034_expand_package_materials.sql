-- Add more package/material combinations

-- Add all vinyl_cast to all packages with 1.0 multiplier
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 1.00
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'vinyl_cast'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

-- Add all vinyl_calendared to FULL and PART packages with 0.5 multiplier
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 0.50
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'vinyl_calendared'
AND p.code LIKE 'FULL-%' 
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

-- Add all vinyl_calendared to PART packages with 0.6 multiplier
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 0.60
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'vinyl_calendared'
AND p.code LIKE 'PART-%'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

-- Add vinyl_calendared to ACCENT packages with 0.4 multiplier
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 0.40
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'vinyl_calendared'
AND p.code LIKE 'ACCENT-%'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

-- Add specialty materials to FULL and PART packages
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 1.50
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'specialty'
AND p.code LIKE 'FULL-%'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 1.25
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'specialty'
AND p.code LIKE 'PART-%'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

-- Add specialty to ACCENT with 0.8 multiplier
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 0.80
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'specialty'
AND p.code LIKE 'ACCENT-%'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

-- Ensure PPF only in PPF packages
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 1.00
FROM wrap_packages p, wrap_materials m
WHERE m.category = 'ppf'
AND p.code LIKE 'PPF-%'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

-- Add commercial packages to COMM packages
INSERT INTO package_materials (package_id, material_id, material_multiplier)
SELECT p.id, m.id, 
    CASE WHEN m.category = 'vinyl_cast' THEN 1.00 
         WHEN m.category = 'vinyl_calendared' THEN 0.45
         ELSE 1.25 END
FROM wrap_packages p, wrap_materials m
WHERE m.category IN ('vinyl_cast', 'vinyl_calendared')
AND p.code LIKE 'COMM-%'
AND NOT EXISTS (
    SELECT 1 FROM package_materials pm 
    WHERE pm.package_id = p.id AND pm.material_id = m.id
)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM package_materials;
    RAISE NOTICE 'Total package_materials combinations: %', v_count;
END $$;