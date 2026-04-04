-- Fix RLS policies for company_chosen_phases table
-- The current policies are causing permission issues

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage chosen phases" ON company_chosen_phases;
DROP POLICY IF EXISTS "Users can view chosen phases" ON company_chosen_phases;
DROP POLICY IF EXISTS "Users can view company chosen phases" ON company_chosen_phases;

-- Create clean, working RLS policies
CREATE POLICY "company_chosen_phases_select" ON company_chosen_phases
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "company_chosen_phases_insert" ON company_chosen_phases
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "company_chosen_phases_update" ON company_chosen_phases
  FOR UPDATE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "company_chosen_phases_delete" ON company_chosen_phases
  FOR DELETE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE company_chosen_phases ENABLE ROW LEVEL SECURITY;