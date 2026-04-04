-- Add scenario_name column to product_npv_analyses table
ALTER TABLE product_npv_analyses 
ADD COLUMN IF NOT EXISTS scenario_name TEXT DEFAULT 'Base Case';

-- Add index for faster scenario lookups
CREATE INDEX IF NOT EXISTS idx_product_npv_scenario 
ON product_npv_analyses(product_id, scenario_name);