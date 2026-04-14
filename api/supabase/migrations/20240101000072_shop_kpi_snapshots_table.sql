-- WrapOs Database Schema - Shop KPI Snapshots Table (Issue #55)

CREATE TABLE IF NOT EXISTS shop_kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    snapshot_date DATE NOT NULL,
    close_rate DECIMAL(5,2),
    avg_ticket DECIMAL(10,2),
    upsell_rate DECIMAL(5,2),
    on_time_rate DECIMAL(5,2),
    review_score DECIMAL(3,2),
    composite_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_kpi_snapshots_org_id ON shop_kpi_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_shop_kpi_snapshots_snapshot_date ON shop_kpi_snapshots(snapshot_date);

ALTER TABLE shop_kpi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON shop_kpi_snapshots
    FOR ALL USING (true) WITH CHECK (true);
