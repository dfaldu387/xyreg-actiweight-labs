
-- Simplified RLS Policy Fix for CSV Import - Avoiding Deadlocks
-- Only fix the specific policies causing CSV import issues

-- First, just drop and recreate the problematic INSERT policies
DROP POLICY IF EXISTS "Users can insert phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can insert company document templates" ON company_document_templates;

-- Create the corrected INSERT policies with proper table references
CREATE POLICY "phase_assigned_documents_insert_policy" ON phase_assigned_documents
  FOR INSERT 
  WITH CHECK (
    phase_id IN (
      SELECT cp.id 
      FROM company_phases cp
      JOIN user_company_access uca ON uca.company_id = cp.company_id
      WHERE uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "company_document_templates_insert_policy" ON company_document_templates
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

-- Quick verification
SELECT 'CSV import RLS policies fixed' as status;
