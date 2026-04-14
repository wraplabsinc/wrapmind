-- Migration: Update all vehicle_type from metadata vclass
UPDATE cars 
SET vehicle_type = CASE 
    WHEN metadata->>'vclass' = 'Two Seaters' THEN 'coupe'
    WHEN metadata->>'vclass' = 'Minicompact Cars' THEN 'coupe'
    WHEN metadata->>'vclass' = 'Subcompact Cars' THEN 'hatchback'
    WHEN metadata->>'vclass' = 'Compact Cars' THEN 'sedan'
    WHEN metadata->>'vclass' IN ('Midsize Cars', 'Mid-Size Cars') THEN 'sedan'
    WHEN metadata->>'vclass' = 'Large Cars' THEN 'sedan'
    WHEN metadata->>'vclass' = 'Small Station Wagons' THEN 'wagon'
    WHEN metadata->>'vclass' IN ('Mid-Size Cars Station Wagons', 'Large Cars Station Wagons') THEN 'wagon'
    WHEN metadata->>'vclass' IN ('Small Pickup Trucks', 'Standard Pickup Trucks', 'Small Pickup', 'Standard Pickup') THEN 'truck'
    WHEN metadata->>'vclass' IN ('Passenger Vans', 'Cargo Vans', 'Minivans') THEN 'van'
    WHEN metadata->>'vclass' LIKE '%Sport Utility%' THEN 'suv'
    WHEN metadata->>'vclass' LIKE '%SUV%' THEN 'suv'
    WHEN metadata->>'vclass' = 'Special Purpose Vehicles' THEN 'suv'
    ELSE vehicle_type
END
WHERE vehicle_type IS NULL AND metadata->>'vclass' IS NOT NULL;
