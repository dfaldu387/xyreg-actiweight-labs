-- Drop any remaining policies first
DROP POLICY IF EXISTS "Users can view family field values for their company" ON public.family_field_values;
DROP POLICY IF EXISTS "Users can insert family field values for their company" ON public.family_field_values;
DROP POLICY IF EXISTS "Users can update family field values for their company" ON public.family_field_values;
DROP POLICY IF EXISTS "Users can delete family field values for their company" ON public.family_field_values;

-- Recreate with user_company_access pattern
CREATE POLICY "Users can view family field values for their company"
ON public.family_field_values FOR SELECT TO authenticated
USING (company_id IN (
  SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
));

CREATE POLICY "Users can insert family field values for their company"
ON public.family_field_values FOR INSERT TO authenticated
WITH CHECK (company_id IN (
  SELECT uca.company_id FROM user_company_access uca
  WHERE uca.user_id = auth.uid()
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update family field values for their company"
ON public.family_field_values FOR UPDATE TO authenticated
USING (company_id IN (
  SELECT uca.company_id FROM user_company_access uca
  WHERE uca.user_id = auth.uid()
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete family field values for their company"
ON public.family_field_values FOR DELETE TO authenticated
USING (company_id IN (
  SELECT uca.company_id FROM user_company_access uca
  WHERE uca.user_id = auth.uid()
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));