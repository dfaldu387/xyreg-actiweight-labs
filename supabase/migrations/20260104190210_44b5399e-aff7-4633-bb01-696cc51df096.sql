-- Allow anonymous SELECT on hazards for products belonging to companies with active investor share links
CREATE POLICY "anon_select_hazards_for_active_investor_share"
ON public.hazards
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 
    FROM public.products p
    JOIN public.company_investor_share_settings cis ON cis.company_id = p.company_id
    WHERE p.id = hazards.product_id
      AND cis.is_active = true
  )
);