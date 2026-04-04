-- Create a security definer function to check user company access for lifecycle phases
CREATE OR REPLACE FUNCTION public.user_can_access_lifecycle_phase(phase_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = phase_product_id 
    AND uca.user_id = auth.uid()
  );
$$;

-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can read lifecycle_phases for their company products" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Users can update lifecycle_phases for their company products" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Users can insert lifecycle_phases for their company products" ON public.lifecycle_phases;
DROP POLICY IF EXISTS "Users can delete lifecycle_phases for their company products" ON public.lifecycle_phases;

-- Create simplified RLS policies using the security definer function
CREATE POLICY "Users can read lifecycle_phases for accessible products" ON public.lifecycle_phases
FOR SELECT
TO authenticated
USING (public.user_can_access_lifecycle_phase(product_id));

CREATE POLICY "Users can update lifecycle_phases for accessible products" ON public.lifecycle_phases
FOR UPDATE
TO authenticated
USING (public.user_can_access_lifecycle_phase(product_id))
WITH CHECK (public.user_can_access_lifecycle_phase(product_id));

CREATE POLICY "Users can insert lifecycle_phases for accessible products" ON public.lifecycle_phases
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_lifecycle_phase(product_id));

CREATE POLICY "Users can delete lifecycle_phases for accessible products" ON public.lifecycle_phases
FOR DELETE
TO authenticated
USING (public.user_can_access_lifecycle_phase(product_id));