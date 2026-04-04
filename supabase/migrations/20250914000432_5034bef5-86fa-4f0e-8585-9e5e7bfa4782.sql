-- Enable RLS and add policies for market_extensions table

-- Enable Row Level Security
ALTER TABLE market_extensions ENABLE ROW LEVEL SECURITY;

-- Policy for viewing market extensions (users can view extensions for companies they have access to)
CREATE POLICY "Users can view market extensions for accessible companies" 
ON market_extensions 
FOR SELECT 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);

-- Policy for creating market extensions (admin/editor can create)
CREATE POLICY "Users can create market extensions for their companies" 
ON market_extensions 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

-- Policy for updating market extensions (admin/editor can update)
CREATE POLICY "Users can update market extensions for their companies" 
ON market_extensions 
FOR UPDATE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

-- Policy for deleting market extensions (admin/editor can delete)
CREATE POLICY "Users can delete market extensions for their companies" 
ON market_extensions 
FOR DELETE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);