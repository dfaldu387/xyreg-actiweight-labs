
-- Enable RLS on lifecycle_phases table
ALTER TABLE public.lifecycle_phases ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read lifecycle_phases for products in their companies
CREATE POLICY "Users can read lifecycle_phases for their company products" ON public.lifecycle_phases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = lifecycle_phases.product_id
    AND uca.user_id = auth.uid()
  )
);

-- Policy for authenticated users to update lifecycle_phases for products in their companies
CREATE POLICY "Users can update lifecycle_phases for their company products" ON public.lifecycle_phases
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = lifecycle_phases.product_id
    AND uca.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = lifecycle_phases.product_id
    AND uca.user_id = auth.uid()
  )
);

-- Policy for authenticated users to insert lifecycle_phases for products in their companies
CREATE POLICY "Users can insert lifecycle_phases for their company products" ON public.lifecycle_phases
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = lifecycle_phases.product_id
    AND uca.user_id = auth.uid()
  )
);
