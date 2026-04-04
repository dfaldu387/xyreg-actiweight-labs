-- Add is_feasibility_study column to product_bundles table
ALTER TABLE product_bundles 
ADD COLUMN is_feasibility_study BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering
CREATE INDEX idx_product_bundles_feasibility 
ON product_bundles(company_id, is_feasibility_study);

-- Add comment
COMMENT ON COLUMN product_bundles.is_feasibility_study IS 
'Indicates if this bundle is for feasibility study purposes';