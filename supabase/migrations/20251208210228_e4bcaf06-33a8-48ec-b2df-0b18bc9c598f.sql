-- Allow authenticated users to view products from companies with active marketplace listings
CREATE POLICY "Allow authenticated read of products for marketplace"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_investor_share_settings cis
    WHERE cis.company_id = products.company_id
    AND cis.is_active = true
    AND cis.list_on_marketplace = true
  )
);