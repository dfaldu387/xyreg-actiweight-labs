-- Drop existing RLS policies that use wrong table
DROP POLICY IF EXISTS "Users can view high level risks for their company" ON public.product_high_level_risks;
DROP POLICY IF EXISTS "Users can create high level risks for their company" ON public.product_high_level_risks;
DROP POLICY IF EXISTS "Users can update high level risks for their company" ON public.product_high_level_risks;
DROP POLICY IF EXISTS "Users can delete high level risks for their company" ON public.product_high_level_risks;

-- Recreate RLS Policies using user_profiles table (consistent with other tables)
CREATE POLICY "Users can view high level risks for their company"
  ON public.product_high_level_risks
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create high level risks for their company"
  ON public.product_high_level_risks
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update high level risks for their company"
  ON public.product_high_level_risks
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete high level risks for their company"
  ON public.product_high_level_risks
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );