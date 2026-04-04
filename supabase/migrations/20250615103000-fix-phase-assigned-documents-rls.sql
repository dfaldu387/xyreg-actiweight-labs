
-- Ensure proper RLS policies for phase_assigned_documents table
-- This table is used for company document templates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can insert phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can update phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can delete phase assigned documents" ON phase_assigned_documents;

-- Create comprehensive RLS policies for phase_assigned_documents

-- SELECT policy: Users can view documents for phases belonging to their companies
CREATE POLICY "Users can view phase assigned documents" ON phase_assigned_documents
  FOR SELECT 
  USING (
    phase_id IN (
      SELECT p.id 
      FROM phases p
      JOIN user_company_access uca ON uca.company_id = p.company_id
      WHERE uca.user_id = auth.uid()
    )
  );

-- INSERT policy: Users can create documents for phases in their companies (admin/editor only)
CREATE POLICY "Users can insert phase assigned documents" ON phase_assigned_documents
  FOR INSERT 
  WITH CHECK (
    phase_id IN (
      SELECT p.id 
      FROM phases p
      JOIN user_company_access uca ON uca.company_id = p.company_id
      WHERE uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  );

-- UPDATE policy: Users can update documents for phases in their companies (admin/editor only)
CREATE POLICY "Users can update phase assigned documents" ON phase_assigned_documents
  FOR UPDATE 
  USING (
    phase_id IN (
      SELECT p.id 
      FROM phases p
      JOIN user_company_access uca ON uca.company_id = p.company_id
      WHERE uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    phase_id IN (
      SELECT p.id 
      FROM phases p
      JOIN user_company_access uca ON uca.company_id = p.company_id
      WHERE uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  );

-- DELETE policy: Users can delete documents for phases in their companies (admin/editor only)
CREATE POLICY "Users can delete phase assigned documents" ON phase_assigned_documents
  FOR DELETE 
  USING (
    phase_id IN (
      SELECT p.id 
      FROM phases p
      JOIN user_company_access uca ON uca.company_id = p.company_id
      WHERE uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  );

-- Enable RLS on the table
ALTER TABLE phase_assigned_documents ENABLE ROW LEVEL SECURITY;
