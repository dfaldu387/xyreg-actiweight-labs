-- Update INSERT policy to also allow consultants
DROP POLICY "Users can create V&V plans for their companies" ON public.vv_plans;
CREATE POLICY "Users can create V&V plans for their companies"
ON public.vv_plans
FOR INSERT
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
));

-- Update UPDATE policy similarly
DROP POLICY "Users can update V&V plans for their companies" ON public.vv_plans;
CREATE POLICY "Users can update V&V plans for their companies"
ON public.vv_plans
FOR UPDATE
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
));

-- Update DELETE policy similarly
DROP POLICY "Users can delete V&V plans for their companies" ON public.vv_plans;
CREATE POLICY "Users can delete V&V plans for their companies"
ON public.vv_plans
FOR DELETE
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
));