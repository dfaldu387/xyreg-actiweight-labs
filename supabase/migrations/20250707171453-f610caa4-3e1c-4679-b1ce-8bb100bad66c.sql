-- Fix lifecycle_phases RLS policies to resolve permission denied errors
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.lifecycle_phases;

-- Create proper RLS policies that check user company access
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