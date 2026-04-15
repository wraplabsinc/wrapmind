-- WrapOs Database Schema - Film Calculator Results Table (Issue #31)

-- Create film_calculator_results table
CREATE TABLE IF NOT EXISTS film_calculator_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    vehicle_class VARCHAR(50),
    service_type VARCHAR(50),
    film_brand VARCHAR(100),
    film_sku VARCHAR(100),
    linear_feet DECIMAL(8,2),
    waste_pct DECIMAL(4,2),
    rolls_needed INT,
    material_cost DECIMAL(10,2),
    supplier VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_film_calculator_results_estimate_id ON film_calculator_results(estimate_id);
CREATE INDEX IF NOT EXISTS idx_film_calculator_results_vehicle_class ON film_calculator_results(vehicle_class);
CREATE INDEX IF NOT EXISTS idx_film_calculator_results_service_type ON film_calculator_results(service_type);
CREATE INDEX IF NOT EXISTS idx_film_calculator_results_film_brand ON film_calculator_results(film_brand);
CREATE INDEX IF NOT EXISTS idx_film_calculator_results_created_at ON film_calculator_results(created_at);

-- Enable RLS
ALTER TABLE film_calculator_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON film_calculator_results
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_film_calculator_results_updated_at
    BEFORE UPDATE ON film_calculator_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
