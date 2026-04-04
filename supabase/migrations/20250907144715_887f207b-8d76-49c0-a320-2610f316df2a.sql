-- Enable RLS on activity_templates table and create proper policies
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;

-- Users can view activity templates for their companies
CREATE POLICY "Users can view activity templates for their companies" 
ON activity_templates FOR SELECT 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);

-- Users can create activity templates for their companies
CREATE POLICY "Users can create activity templates for their companies" 
ON activity_templates FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

-- Users can update activity templates for their companies
CREATE POLICY "Users can update activity templates for their companies" 
ON activity_templates FOR UPDATE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

-- Users can delete activity templates for their companies
CREATE POLICY "Users can delete activity templates for their companies" 
ON activity_templates FOR DELETE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

-- Add missing columns for file storage
ALTER TABLE activity_templates 
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS file_name text;