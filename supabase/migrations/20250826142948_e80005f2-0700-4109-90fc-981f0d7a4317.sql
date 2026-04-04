-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents table
CREATE POLICY "Users can view documents for their companies" ON public.documents
FOR SELECT USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and editors can manage documents for their companies" ON public.documents
FOR ALL USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
) WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);