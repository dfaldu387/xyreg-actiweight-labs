-- Fix RLS policies for company_chosen_phases - use simpler auth check
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view chosen phases for their companies" ON company_chosen_phases;
DROP POLICY IF EXISTS "Users can insert chosen phases for their companies" ON company_chosen_phases;
DROP POLICY IF EXISTS "Users can update chosen phases for their companies" ON company_chosen_phases;
DROP POLICY IF EXISTS "Users can delete chosen phases for their companies" ON company_chosen_phases;

-- Create new simplified policies that check auth.uid() directly
CREATE POLICY "Users can view chosen phases for their companies"
ON company_chosen_phases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_access
    WHERE user_company_access.company_id = company_chosen_phases.company_id
    AND user_company_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert chosen phases for their companies"
ON company_chosen_phases
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_company_access
    WHERE user_company_access.company_id = company_chosen_phases.company_id
    AND user_company_access.user_id = auth.uid()
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update chosen phases for their companies"
ON company_chosen_phases
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_access
    WHERE user_company_access.company_id = company_chosen_phases.company_id
    AND user_company_access.user_id = auth.uid()
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete chosen phases for their companies"
ON company_chosen_phases
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_access
    WHERE user_company_access.company_id = company_chosen_phases.company_id
    AND user_company_access.user_id = auth.uid()
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);