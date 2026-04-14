-- Migration: Add vehicle_type, trim, and improved indexes

-- Create vehicle_types enum
DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'truck', 'van', 'coupe', 'hatchback', 'wagon', 'convertible', 'crossover');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns if they don't exist
DO $$ BEGIN
    ALTER TABLE cars ADD COLUMN vehicle_type vehicle_type;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE cars ADD COLUMN trim VARCHAR(100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Drop old indexes
DROP INDEX IF EXISTS idx_cars_make_model;
DROP INDEX IF EXISTS idx_cars_year;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_cars_make_model_year ON cars(make, model, year);
CREATE INDEX IF NOT EXISTS idx_cars_trim ON cars(trim);
CREATE INDEX IF NOT EXISTS idx_cars_vehicle_type ON cars(vehicle_type);

-- Add CHECK constraint for year if not exists
DO $$ BEGIN
    ALTER TABLE cars ADD CONSTRAINT cars_year_check CHECK (year BETWEEN 1900 AND 2030);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Set trim to 'Base' where NULL (backfill existing records)
UPDATE cars SET trim = 'Base' WHERE trim IS NULL;
ALTER TABLE cars ALTER COLUMN trim SET NOT NULL;
