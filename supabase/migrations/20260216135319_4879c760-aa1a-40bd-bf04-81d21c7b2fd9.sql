-- Update INSERT policy to include consultant role
DROP POLICY "Users can create test cases for their companies" ON public.test_cases;
CREATE POLICY "Users can create test cases for their companies" 
ON public.test_cases 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Also update UPDATE policy for consistency
DROP POLICY "Users can update test cases for their companies" ON public.test_cases;
CREATE POLICY "Users can update test cases for their companies" 
ON public.test_cases 
FOR UPDATE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);