-- Seed data for WrapIQ API testing

-- Create test organization
INSERT INTO organizations (id, name, plan_tier, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'WrapIQ Test Shop', 'pro', true)
ON CONFLICT DO NOTHING;

-- Create test user (password: password123)
INSERT INTO users (id, first_name, last_name, email, phone, role, password_hash, org_id, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Test',
    'Owner',
    'test@wrapiq.com',
    '+18055551234',
    'owner',
    '$2b$10$ZrJTwzokbwWnG9JZsGzV1.OLCHEVyvHNjaCWHv3Q/Bdc1B3B1ZNuG',
    '00000000-0000-0000-0000-000000000001',
    true
)
ON CONFLICT DO NOTHING;

-- Create test writer user
INSERT INTO users (id, first_name, last_name, email, phone, role, password_hash, org_id, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Jane',
    'Writer',
    'writer@wrapiq.com',
    '+18055555678',
    'writer',
    '$2b$10$ZrJTwzokbwWnG9JZsGzV1.OLCHEVyvHNjaCWHv3Q/Bdc1B3B1ZNuG',
    '00000000-0000-0000-0000-000000000001',
    true
)
ON CONFLICT DO NOTHING;

-- Create shop settings
INSERT INTO shop_settings (org_id, shop_name, labor_rate_general, labor_rate_ppf, tax_rate, shop_supplies_pct, cc_fee_pct, estimate_id_prefix)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'WrapIQ Test Shop',
    125.00,
    195.00,
    7.25,
    5.0,
    3.5,
    'WL'
)
ON CONFLICT DO NOTHING;

-- Create test clients
INSERT INTO clients (id, org_id, first_name, last_name, email, phone)
VALUES 
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'John', 'Doe', 'john@example.com', '+18055551001'),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Jane', 'Smith', 'jane@example.com', '+18055551002')
ON CONFLICT DO NOTHING;

-- Create test estimates
INSERT INTO estimates (id, org_id, estimate_id, client_id, created_by, status, vehicle_json, line_items_json, subtotal, tax, total)
VALUES 
    (
        '00000000-0000-0000-0000-000000000100',
        '00000000-0000-0000-0000-000000000001',
        'WL-0001',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'draft',
        '{"make":"Porsche","model":"911","year":2023,"vehicle_class":"sportsCoupe"}',
        '[{"name":"Full Wrap","price":8500},{"name":"Chrome Delete","price":1200}]',
        9700.00,
        703.25,
        10403.25
    ),
    (
        '00000000-0000-0000-0000-000000000101',
        '00000000-0000-0000-0000-000000000001',
        'WL-0002',
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000001',
        'sent',
        '{"make":"Tesla","model":"Model S","year":2024,"vehicle_class":"largeSedan"}',
        '[{"name":"PPF Front","price":2500}]',
        2500.00,
        181.25,
        2681.25
    )
ON CONFLICT DO NOTHING;

-- Create intake leads
INSERT INTO intake_leads (id, org_id, first_name, last_name, email, phone, status, vehicle_year, vehicle_make, vehicle_model)
VALUES 
    ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000001', 'Mike', 'Johnson', 'mike@example.com', '+18055552001', 'new', 2023, 'BMW', 'M4')
ON CONFLICT DO NOTHING;

-- Create test upsells (estimate_upsells)
INSERT INTO estimate_upsells (org_id, estimate_id, service_name, presented_to_client, accepted_by_client)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 'Ceramic Coating', true, true),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 'Paint Protection Film', true, false)
ON CONFLICT DO NOTHING;
