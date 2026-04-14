-- WrapOs Database Schema - Inventory Table (Issue #52)

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    film_sku_id UUID NOT NULL,
    yards_on_hand DECIMAL(8,2) DEFAULT 0,
    yards_reserved DECIMAL(8,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_org_id ON inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_film_sku_id ON inventory(film_sku_id);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON inventory
    FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
