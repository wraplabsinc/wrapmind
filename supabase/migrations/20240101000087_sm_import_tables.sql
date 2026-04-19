-- Run this against the production Supabase database to create sm_import_* tables
-- Go to: https://supabase.com/dashboard → Project → SQL Editor → paste and run

CREATE TABLE IF NOT EXISTS sm_import_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    sm_customer_id VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    sm_data JSONB,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, sm_customer_id)
);

CREATE TABLE IF NOT EXISTS sm_import_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    sm_vehicle_id VARCHAR(100) NOT NULL,
    sm_customer_id VARCHAR(100),
    year INTEGER,
    make VARCHAR(100),
    model VARCHAR(100),
    vin VARCHAR(50),
    license_plate VARCHAR(50),
    color VARCHAR(50),
    vehicle_type VARCHAR(50),
    sm_data JSONB,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, sm_vehicle_id)
);

CREATE TABLE IF NOT EXISTS sm_import_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    sm_order_id VARCHAR(100) NOT NULL,
    sm_customer_id VARCHAR(100),
    sm_vehicle_id VARCHAR(100),
    status VARCHAR(100),
    total DECIMAL(10,2),
    tax_total DECIMAL(10,2),
    labor_total DECIMAL(10,2),
    parts_total DECIMAL(10,2),
    notes TEXT,
    sm_vehicle_data JSONB,
    sm_data JSONB,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, sm_order_id)
);

CREATE TABLE IF NOT EXISTS sm_import_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    sm_order_id VARCHAR(100) NOT NULL,
    sm_line_id VARCHAR(100),
    description TEXT,
    line_type VARCHAR(50),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    total DECIMAL(10,2),
    tax_rate DECIMAL(5,4),
    sm_data JSONB,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, sm_order_id, sm_line_id)
);

CREATE TABLE IF NOT EXISTS sm_import_labor_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    sm_labor_rate_id VARCHAR(100) NOT NULL,
    name VARCHAR(100),
    rate DECIMAL(10,2),
    sm_data JSONB,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, sm_labor_rate_id)
);

CREATE INDEX IF NOT EXISTS idx_sm_import_customers_org_id ON sm_import_customers(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_customers_sm_customer_id ON sm_import_customers(sm_customer_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_vehicles_org_id ON sm_import_vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_vehicles_sm_vehicle_id ON sm_import_vehicles(sm_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_vehicles_sm_customer_id ON sm_import_vehicles(sm_customer_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_orders_org_id ON sm_import_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_orders_sm_order_id ON sm_import_orders(sm_order_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_orders_sm_customer_id ON sm_import_orders(sm_customer_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_order_lines_org_id ON sm_import_order_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_order_lines_sm_order_id ON sm_import_order_lines(sm_order_id);
CREATE INDEX IF NOT EXISTS idx_sm_import_labor_rates_org_id ON sm_import_labor_rates(org_id);

ALTER TABLE sm_import_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_import_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_import_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_import_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_import_labor_rates ENABLE ROW LEVEL SECURITY;

-- Service role key bypasses RLS, so these policies allow auth.uid() to work for regular users
CREATE POLICY "Allow all access for organization members" ON sm_import_customers FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Allow all access for organization members" ON sm_import_vehicles FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Allow all access for organization members" ON sm_import_orders FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Allow all access for organization members" ON sm_import_order_lines FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Allow all access for organization members" ON sm_import_labor_rates FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
