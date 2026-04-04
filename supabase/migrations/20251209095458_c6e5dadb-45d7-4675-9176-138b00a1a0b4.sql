-- Drop and recreate the RLS policy for product_viability_scorecards 
-- to ensure it correctly allows public access for investor view
DROP POLICY IF EXISTS "Allow public read of scorecards for investor view" ON product_viability_scorecards;

CREATE POLICY "Allow public read of scorecards for investor view"
ON product_viability_scorecards
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM company_investor_share_settings s
    WHERE s.featured_product_id = product_viability_scorecards.product_id
      AND s.is_active = true
  )
);