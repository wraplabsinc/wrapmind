-- WrapOs Database Schema - Add Fleet FK to Clients Table (Issue #46)

-- Add fleet_account_id foreign key to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fleet_account_id UUID REFERENCES fleet_accounts(id);

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_clients_fleet_account_id ON clients(fleet_account_id);
