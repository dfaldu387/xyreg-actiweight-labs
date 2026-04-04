-- Drop existing broken policies that reference profiles table
DROP POLICY IF EXISTS "Users can view usability studies for their company products" ON public.usability_studies;
DROP POLICY IF EXISTS "Users can insert usability studies for their company" ON public.usability_studies;
DROP POLICY IF EXISTS "Users can update usability studies for their company" ON public.usability_studies;
DROP POLICY IF EXISTS "Users can delete usability studies for their company" ON public.usability_studies;

-- SELECT: any company member can view
CREATE POLICY "Company members can view usability studies"
ON public.usability_studies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = usability_studies.company_id
    AND uca.user_id = auth.uid()
  )
);

-- INSERT: admin/editor/consultant can insert
CREATE POLICY "Company editors can insert usability studies"
ON public.usability_studies FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = usability_studies.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
  AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = usability_studies.product_id
    AND p.company_id = usability_studies.company_id
  )
);

-- UPDATE: admin/editor/consultant can update
CREATE POLICY "Company editors can update usability studies"
ON public.usability_studies FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = usability_studies.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = usability_studies.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- DELETE: admin/editor/consultant can delete
CREATE POLICY "Company editors can delete usability studies"
ON public.usability_studies FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = usability_studies.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);