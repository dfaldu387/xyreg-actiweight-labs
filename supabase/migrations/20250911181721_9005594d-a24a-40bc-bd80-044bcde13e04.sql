-- Add total_development_costs column to product_rnpv_inputs table
ALTER TABLE product_rnpv_inputs 
ADD COLUMN IF NOT EXISTS total_development_costs NUMERIC DEFAULT 0;