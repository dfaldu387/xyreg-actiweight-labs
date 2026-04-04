-- Add RLS policies for company_chosen_phases table
-- This table tracks which phases are active for each company

-- Enable RLS if not already enabled
ALTER TABLE company_chosen_phases ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT - users can view chosen phases for their companies
CREATE POLICY "Users can view chosen phases for their companies"
ON company_chosen_phases
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access
    WHERE user_id = auth.uid()
  )
);

-- Policy for INSERT - users with admin/editor access can add chosen phases
CREATE POLICY "Users can insert chosen phases for their companies"
ON company_chosen_phases
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_company_access
    WHERE user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

-- Policy for UPDATE - users with admin/editor access can update chosen phases
CREATE POLICY "Users can update chosen phases for their companies"
ON company_chosen_phases
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access
    WHERE user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

-- Policy for DELETE - users with admin/editor access can delete chosen phases
CREATE POLICY "Users can delete chosen phases for their companies"
ON company_chosen_phases
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access
    WHERE user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);