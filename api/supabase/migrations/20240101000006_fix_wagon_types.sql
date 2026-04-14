-- Migration: Update remaining vehicle_type from metadata vclass (fix station wagon and other variants)
UPDATE cars 
SET vehicle_type = CASE 
    WHEN metadata->>'vclass' LIKE '%Station Wagon%' THEN 'wagon'
    WHEN metadata->>'vclass' LIKE '%Wagon%' THEN 'wagon'
    ELSE vehicle_type
END
WHERE vehicle_type IS NULL AND metadata->>'vclass' IS NOT NULL;
