-- WrapOs Database Schema - ShopMonkey Data Intelligence (Phase 2: Import Log, Comparisons, AI Insights)

CREATE TABLE IF NOT EXISTS sm_import_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    import_type VARCHAR(50) NOT NULL,
    records_imported INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sm_quote_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    sm_order_id VARCHAR(100) NOT NULL,
    wrapos_estimate_id UUID REFERENCES estimates(id),
    sm_order_data JSONB,
    wrapos_estimate_data JSONB,
    sm_labor_hours DECIMAL(10,2),
    wrapos_labor_hours DECIMAL(10,2),
    labor_hours_variance DECIMAL(10,2),
    labor_hours_variance_pct DECIMAL(10,2),
    sm_material_cost DECIMAL(10,2),
    wrapos_material_cost DECIMAL(10,2),
    material_cost_variance DECIMAL(10,2),
    material_cost_variance_pct DECIMAL(10,2),
    sm_total DECIMAL(10,2),
    wrapos_total DECIMAL(10,2),
    total_variance DECIMAL(10,2),
    total_variance_pct DECIMAL(10,2),
    accuracy_score DECIMAL(5,2),
    labor_accuracy_score DECIMAL(5,2),
    material_accuracy_score DECIMAL(5,2),
    accuracy_tier VARCHAR(20),
    match_confidence VARCHAR(20),
    comparison_status VARCHAR(50),
    compared_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, sm_order_id)
);

CREATE TABLE IF NOT EXISTS sm_comparison_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    comparison_id UUID REFERENCES sm_quote_comparisons(id) ON DELETE CASCADE,
    line_number INTEGER,
    sm_description TEXT,
    wrapos_description TEXT,
    sm_line_type VARCHAR(50),
    wrapos_line_type VARCHAR(50),
    sm_quantity DECIMAL(10,2),
    wrapos_quantity DECIMAL(10,2),
    sm_unit_price DECIMAL(10,2),
    wrapos_unit_price DECIMAL(10,2),
    sm_total DECIMAL(10,2),
    wrapos_total DECIMAL(10,2),
    variance DECIMAL(10,2),
    variance_pct DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sm_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    insight_text TEXT NOT NULL,
    recommendation TEXT,
    confidence_score DECIMAL(5,2),
    affected_orders_count INTEGER,
    avg_variance_pct DECIMAL(10,2),
    data_range_start TIMESTAMPTZ,
    data_range_end TIMESTAMPTZ,
    is_actionable BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sm_import_log_org_id ON sm_import_log(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_log_status ON sm_import_log(status);
CREATE INDEX IF NOT EXISTS idx_sm_import_log_import_type ON sm_import_log(import_type);
CREATE INDEX IF NOT EXISTS idx_sm_quote_comparisons_org_id ON sm_quote_comparisons(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_quote_comparisons_sm_order_id ON sm_quote_comparisons(sm_order_id);
CREATE INDEX IF NOT EXISTS idx_sm_quote_comparisons_wrapos_estimate_id ON sm_quote_comparisons(wrapos_estimate_id);
CREATE INDEX IF NOT EXISTS idx_sm_quote_comparisons_accuracy_tier ON sm_quote_comparisons(accuracy_tier);
CREATE INDEX IF NOT EXISTS idx_sm_quote_comparisons_compared_at ON sm_quote_comparisons(compared_at);
CREATE INDEX IF NOT EXISTS idx_sm_comparison_line_items_org_id ON sm_comparison_line_items(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_comparison_line_items_comparison_id ON sm_comparison_line_items(comparison_id);
CREATE INDEX IF NOT EXISTS idx_sm_ai_insights_org_id ON sm_ai_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_ai_insights_insight_type ON sm_ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_sm_ai_insights_is_dismissed ON sm_ai_insights(is_dismissed);

ALTER TABLE sm_import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_quote_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_comparison_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for organization members" ON sm_import_log FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Allow all access for organization members" ON sm_quote_comparisons FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Allow all access for organization members" ON sm_comparison_line_items FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Allow all access for organization members" ON sm_ai_insights FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE TRIGGER tr_sm_quote_comparisons_updated
    BEFORE UPDATE ON sm_quote_comparisons
    FOR EACH ROW EXECUTE FUNCTION update_sm_import_timestamp();

CREATE TRIGGER tr_sm_ai_insights_updated
    BEFORE UPDATE ON sm_ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_sm_import_timestamp();

-- Add sync tracking columns to organizations table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'sm_last_synced_at') THEN
        ALTER TABLE organizations ADD COLUMN sm_last_synced_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'sm_sync_schedule') THEN
        ALTER TABLE organizations ADD COLUMN sm_sync_schedule VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'sm_auto_sync_enabled') THEN
        ALTER TABLE organizations ADD COLUMN sm_auto_sync_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;