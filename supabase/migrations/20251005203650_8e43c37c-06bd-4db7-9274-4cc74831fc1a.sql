-- Create RLS policies for company_chosen_phases table
-- First, check if policies already exist and drop them if needed
DO $$ 
BEGIN
  -- Drop existing policies if they exist (no error if they don't)
  DROP POLICY IF EXISTS "Users can view chosen phases for their companies" ON company_chosen_phases;
  DROP POLICY IF EXISTS "Users can insert chosen phases for their companies" ON company_chosen_phases;
  DROP POLICY IF EXISTS "Users can update chosen phases for their companies" ON company_chosen_phases;
  DROP POLICY IF EXISTS "Users can delete chosen phases for their companies" ON company_chosen_phases;
END $$;

-- Now create the policies fresh
-- SELECT policy
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

-- INSERT policy  
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

-- UPDATE policy
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

-- DELETE policy
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