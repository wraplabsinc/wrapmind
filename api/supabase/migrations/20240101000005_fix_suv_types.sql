-- Migration: Update remaining vehicle_type from metadata vclass (fix SUV variants)
UPDATE cars 
SET vehicle_type = CASE 
    WHEN metadata->>'vclass' LIKE '%Sport Utility%' THEN 'suv'
    WHEN metadata->>'vclass' LIKE '%SUV%' THEN 'suv'
    ELSE vehicle_type
END
WHERE vehicle_type IS NULL AND metadata->>'vclass' IS NOT NULL;
