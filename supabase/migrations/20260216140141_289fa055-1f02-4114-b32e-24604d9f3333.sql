-- Update traceability_links INSERT policy to include consultant
DROP POLICY "Users can create traceability links for their companies" ON public.traceability_links;
CREATE POLICY "Users can create traceability links for their companies" 
ON public.traceability_links 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Update UPDATE policy
DROP POLICY "Users can update traceability links for their companies" ON public.traceability_links;
CREATE POLICY "Users can update traceability links for their companies" 
ON public.traceability_links 
FOR UPDATE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Update DELETE policy
DROP POLICY "Users can delete traceability links for their companies" ON public.traceability_links;
CREATE POLICY "Users can delete traceability links for their companies" 
ON public.traceability_links 
FOR DELETE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);