-- First, let's check what RLS policies exist and fix them
DROP POLICY IF EXISTS "Users can read lifecycle_phases for their company products" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Users can update lifecycle_phases for their company products" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Users can insert lifecycle_phases for their company products" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Users can delete lifecycle_phases for their company products" ON public.lifecycle_phases;

-- Create working RLS policies that properly check company access
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

CREATE POLICY "Users can delete lifecycle_phases for their company products" ON public.lifecycle_phases
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = lifecycle_phases.product_id
    AND uca.user_id = auth.uid()
  )
);