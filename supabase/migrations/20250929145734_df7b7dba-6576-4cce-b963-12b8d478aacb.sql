-- Add policies for product_variant_distributions
CREATE POLICY "Users can view variant distributions for their companies"
ON public.product_variant_distributions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.product_accessory_relationships par
    JOIN public.products p ON p.id = par.main_product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE par.id = product_variant_distributions.relationship_id 
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create variant distributions for their companies"
ON public.product_variant_distributions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_accessory_relationships par
    JOIN public.products p ON p.id = par.main_product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE par.id = product_variant_distributions.relationship_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update variant distributions for their companies"
ON public.product_variant_distributions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.product_accessory_relationships par
    JOIN public.products p ON p.id = par.main_product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE par.id = product_variant_distributions.relationship_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete variant distributions for their companies"
ON public.product_variant_distributions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.product_accessory_relationships par
    JOIN public.products p ON p.id = par.main_product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE par.id = product_variant_distributions.relationship_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);