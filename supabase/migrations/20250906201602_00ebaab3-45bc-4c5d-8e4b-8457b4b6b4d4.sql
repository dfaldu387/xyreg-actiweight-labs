-- Enable RLS on activities table and add proper policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activities table
CREATE POLICY "Users can view activities for their companies" 
ON activities 
FOR SELECT 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create activities for their companies" 
ON activities 
FOR INSERT 
WITH CHECK (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update activities for their companies" 
ON activities 
FOR UPDATE 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete activities for their companies" 
ON activities 
FOR DELETE 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));