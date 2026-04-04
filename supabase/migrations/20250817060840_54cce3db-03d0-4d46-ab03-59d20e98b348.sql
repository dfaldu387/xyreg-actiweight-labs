-- Enable RLS and create policies for product variant tables

-- Enable RLS for product_variant_values if not already enabled
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;

-- Create policies for product_variant_values
CREATE POLICY "Users can view variant values for their company products" 
ON public.product_variant_values 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE pv.id = product_variant_values.product_variant_id 
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can manage variant values for their company products" 
ON public.product_variant_values 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE pv.id = product_variant_values.product_variant_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE pv.id = product_variant_values.product_variant_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

-- Enable RLS for product_variants if not already enabled
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product_variants
CREATE POLICY "Users can view variants for their company products" 
ON public.product_variants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_variants.product_id 
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can manage variants for their company products" 
ON public.product_variants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_variants.product_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_variants.product_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);