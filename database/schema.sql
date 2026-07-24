-- Create main inventory table (for permanent storage if needed)
CREATE TABLE IF NOT EXISTS inventory (
    product_id TEXT PRIMARY KEY,
    current_inventory_count INTEGER NOT NULL DEFAULT 0,
    committed_stock_count INTEGER NOT NULL DEFAULT 0,
    in_transit_quantity INTEGER NOT NULL DEFAULT 0,
    supplier_lead_time_hours FLOAT NOT NULL DEFAULT 0,
    safety_stock_level INTEGER NOT NULL DEFAULT 0,
    avg_daily_demand INTEGER,
    runout_time_hour FLOAT,
    is_stockout_risk BOOLEAN,
    action_required TEXT,
    last_calculated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create temporary table for processing
CREATE TABLE IF NOT EXISTS inventory_temp (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    current_inventory_count INTEGER NOT NULL DEFAULT 0,
    committed_stock_count INTEGER NOT NULL DEFAULT 0,
    in_transit_quantity INTEGER NOT NULL DEFAULT 0,
    supplier_lead_time_hours FLOAT NOT NULL DEFAULT 0,
    safety_stock_level INTEGER NOT NULL DEFAULT 0,
    avg_daily_demand INTEGER,
    runout_time_hour FLOAT,
    is_stockout_risk BOOLEAN,
    action_required TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    last_calculated_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_session_id ON inventory_temp(session_id);
CREATE INDEX idx_processed ON inventory_temp(processed);
CREATE INDEX idx_product_id ON inventory_temp(product_id);

-- Enable RLS
ALTER TABLE inventory_temp ENABLE ROW LEVEL SECURITY;

-- Create policy for temp table
DROP POLICY IF EXISTS "Allow all" ON inventory_temp;
CREATE POLICY "Allow all" ON inventory_temp
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable RLS for main table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policy for main table
DROP POLICY IF EXISTS "Allow all" ON inventory;
CREATE POLICY "Allow all" ON inventory
    FOR ALL
    USING (true)
    WITH CHECK (true);