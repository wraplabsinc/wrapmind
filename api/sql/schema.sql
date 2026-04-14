-- WrapOs Database Schema
-- Cars table with dimensions, body parts, and vendor pricing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- Create vehicle_types enum
CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'truck', 'van', 'coupe', 'hatchback', 'wagon', 'convertible', 'crossover');

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2030),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100) NOT NULL,
    vehicle_type vehicle_type,
    vin VARCHAR(17) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dimensional data (all measurements in mm)
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    wheelbase_mm INTEGER,
    ground_clearance_mm INTEGER,
    curb_weight_kg DECIMAL(8,2),
    gross_weight_kg DECIMAL(8,2),

    -- Body parts as JSONB (e.g., {"hood": {"length": 1500, "material": "steel"}, "fenders": {...}})
    body_parts JSONB DEFAULT '{}'::jsonb,

    -- Vendor pricing as JSONB (e.g., {"oem": {"hood": 450.00}, "aftermarket": {"hood": 275.50}})
    vendor_pricing JSONB DEFAULT '{}'::jsonb,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cars_make_model_year ON cars(make, model, year);
CREATE INDEX IF NOT EXISTS idx_cars_trim ON cars(trim);
CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);
CREATE INDEX IF NOT EXISTS idx_cars_vehicle_type ON cars(vehicle_type);

-- Enable RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON cars
    FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to cars table
CREATE TRIGGER update_cars_updated_at
    BEFORE UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
