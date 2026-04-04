-- Add RLS policy for authenticated users to read scorecards via investor share link
-- This fixes the issue where company owners viewing their own share link couldn't see the viability score

CREATE POLICY "Authenticated users can read scorecards via investor share link"
ON product_viability_scorecards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM company_investor_share_settings s
    WHERE s.featured_product_id = product_viability_scorecards.product_id
      AND s.is_active = true
  )
);