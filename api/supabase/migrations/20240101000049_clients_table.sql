-- WrapOs Database Schema - Clients Table (Issue #29)

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    preferred_contact VARCHAR(10) DEFAULT 'phone' CHECK (preferred_contact IN ('phone', 'email', 'text')),
    referral_source VARCHAR(50),
    referred_by VARCHAR(100),
    is_vip BOOLEAN DEFAULT false,
    internal_notes TEXT,
    shopmonkey_customer_id VARCHAR(50),
    total_jobs INT DEFAULT 0,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_shopmonkey_customer_id ON clients(shopmonkey_customer_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow open access during development
CREATE POLICY "Allow all access during development" ON clients
    FOR ALL USING (true) WITH CHECK (true);

-- Attach updated_at trigger
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraints now that clients table exists
ALTER TABLE estimates ADD CONSTRAINT fk_estimates_client_id FOREIGN KEY (client_id) REFERENCES clients(id);
