-- WrapOs Database Schema - Job Bookings Table (Issue #60)

CREATE TABLE IF NOT EXISTS job_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    bay_id UUID REFERENCES bays(id),
    start_date TIMESTAMPTZ NOT NULL,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_bookings_estimate_id ON job_bookings(estimate_id);
CREATE INDEX IF NOT EXISTS idx_job_bookings_bay_id ON job_bookings(bay_id);
CREATE INDEX IF NOT EXISTS idx_job_bookings_start_date ON job_bookings(start_date);

ALTER TABLE job_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON job_bookings
    FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_job_bookings_updated_at
    BEFORE UPDATE ON job_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
