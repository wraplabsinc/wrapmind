-- Migration: Update all remaining vehicle_type from metadata vclass (comprehensive fix)
UPDATE cars 
SET vehicle_type = CASE 
    WHEN metadata->>'vclass' LIKE '%Minivan%' THEN 'van'
    WHEN metadata->>'vclass' LIKE '%Pickup%' THEN 'truck'
    WHEN metadata->>'vclass' LIKE '%Station Wagon%' THEN 'wagon'
    WHEN metadata->>'vclass' LIKE '%Wagon%' THEN 'wagon'
    WHEN metadata->>'vclass' LIKE '%Sport Utility%' THEN 'suv'
    WHEN metadata->>'vclass' LIKE '%SUV%' THEN 'suv'
    ELSE vehicle_type
END
WHERE vehicle_type IS NULL AND metadata->>'vclass' IS NOT NULL;
