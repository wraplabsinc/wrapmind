-- WrapOs Database Schema - Portfolio Tags Table (Issue #50)

CREATE TABLE IF NOT EXISTS portfolio_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL,
    vehicle_class VARCHAR(50),
    service_type VARCHAR(50),
    film_brand VARCHAR(100),
    finish VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_tags_photo_id ON portfolio_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_tags_vehicle_class ON portfolio_tags(vehicle_class);
CREATE INDEX IF NOT EXISTS idx_portfolio_tags_service_type ON portfolio_tags(service_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_tags_film_brand ON portfolio_tags(film_brand);

ALTER TABLE portfolio_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON portfolio_tags
    FOR ALL USING (true) WITH CHECK (true);
