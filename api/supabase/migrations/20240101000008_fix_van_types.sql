-- Migration: Update all remaining vehicle_type from metadata vclass (fix Vans variants)
UPDATE cars 
SET vehicle_type = CASE 
    WHEN metadata->>'vclass' LIKE '%Van%' THEN 'van'
    ELSE vehicle_type
END
WHERE vehicle_type IS NULL AND metadata->>'vclass' IS NOT NULL;
