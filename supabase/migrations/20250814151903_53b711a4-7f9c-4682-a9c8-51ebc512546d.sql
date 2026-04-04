-- Add RLS policies for template_settings table
-- Users can view template settings for companies they have access to
CREATE POLICY "Users can view template settings for accessible companies" 
ON template_settings FOR SELECT 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);

-- Users can insert template settings for companies they have admin/editor access to
CREATE POLICY "Users can insert template settings for their companies" 
ON template_settings FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

-- Users can update template settings for companies they have admin/editor access to
CREATE POLICY "Users can update template settings for their companies" 
ON template_settings FOR UPDATE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

-- Users can delete template settings for companies they have admin/editor access to
CREATE POLICY "Users can delete template settings for their companies" 
ON template_settings FOR DELETE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);