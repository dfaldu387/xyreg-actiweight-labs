-- Drop existing write policies
DROP POLICY IF EXISTS "Users can create budget items for accessible phases" ON public.phase_budget_items;
DROP POLICY IF EXISTS "Users can update budget items for accessible phases" ON public.phase_budget_items;
DROP POLICY IF EXISTS "Users can delete budget items for accessible phases" ON public.phase_budget_items;

-- Recreate with consultant included
CREATE POLICY "Users can create budget items for accessible phases"
ON public.phase_budget_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lifecycle_phases lp
    JOIN public.products p ON p.id = lp.product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE lp.id = phase_budget_items.phase_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor', 'consultant')
  )
);

CREATE POLICY "Users can update budget items for accessible phases"
ON public.phase_budget_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.lifecycle_phases lp
    JOIN public.products p ON p.id = lp.product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE lp.id = phase_budget_items.phase_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor', 'consultant')
  )
);

CREATE POLICY "Users can delete budget items for accessible phases"
ON public.phase_budget_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lifecycle_phases lp
    JOIN public.products p ON p.id = lp.product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE lp.id = phase_budget_items.phase_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor', 'consultant')
  )
);