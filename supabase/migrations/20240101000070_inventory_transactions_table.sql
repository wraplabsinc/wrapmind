-- WrapOs Database Schema - Inventory Transactions Table (Issue #53)

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES inventory(id),
    transaction_type VARCHAR(20) NOT NULL,
    yards DECIMAL(8,2) NOT NULL,
    estimate_id UUID REFERENCES estimates(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_estimate_id ON inventory_transactions(estimate_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON inventory_transactions
    FOR ALL USING (true) WITH CHECK (true);
