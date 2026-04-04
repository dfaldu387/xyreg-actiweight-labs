
-- Update INSERT policy to include consultant
DROP POLICY IF EXISTS "Users can create requirement specifications for accessible comp" ON public.requirement_specifications;
CREATE POLICY "Users can create requirement specifications for accessible comp"
ON public.requirement_specifications
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Update UPDATE policy to include consultant
DROP POLICY IF EXISTS "Users can update requirement specifications for accessible comp" ON public.requirement_specifications;
CREATE POLICY "Users can update requirement specifications for accessible comp"
ON public.requirement_specifications
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Update DELETE policy to include consultant
DROP POLICY IF EXISTS "Users can delete requirement specifications for accessible comp" ON public.requirement_specifications;
CREATE POLICY "Users can delete requirement specifications for accessible comp"
ON public.requirement_specifications
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);
