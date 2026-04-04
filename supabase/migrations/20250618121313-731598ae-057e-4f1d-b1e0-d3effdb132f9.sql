
-- Check existing policies and create a targeted cleanup
-- First, let's see what policies currently exist
SELECT 
  schemaname,
  tablename, 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('phase_assigned_documents', 'company_document_templates')
ORDER BY tablename, policyname;

-- Drop only the problematic policies that actually exist
DROP POLICY IF EXISTS "Users can view phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can insert phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can update phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can delete phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "phase_assigned_documents_insert_policy" ON phase_assigned_documents;

DROP POLICY IF EXISTS "Users can view company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can insert company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can update company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can delete company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "company_document_templates_insert_policy" ON company_document_templates;

-- Drop any other existing policies that might conflict
DROP POLICY IF EXISTS "phase_assigned_documents_select" ON phase_assigned_documents;
DROP POLICY IF EXISTS "phase_assigned_documents_insert" ON phase_assigned_documents;
DROP POLICY IF EXISTS "phase_assigned_documents_update" ON phase_assigned_documents;
DROP POLICY IF EXISTS "phase_assigned_documents_delete" ON phase_assigned_documents;

DROP POLICY IF EXISTS "company_document_templates_select" ON company_document_templates;
DROP POLICY IF EXISTS "company_document_templates_insert" ON company_document_templates;
DROP POLICY IF EXISTS "company_document_templates_update" ON company_document_templates;
DROP POLICY IF EXISTS "company_document_templates_delete" ON company_document_templates;

-- Now create the clean policies
CREATE POLICY "phase_assigned_documents_select" ON phase_assigned_documents
  FOR SELECT 
  USING (
    phase_id IN (
      SELECT cp.id 
      FROM company_phases cp
      JOIN user_company_access uca ON uca.company_id = cp.company_id
      WHERE uca.user_id = auth.uid()
    )
  );

CREATE POLICY "phase_assigned_documents_insert" ON phase_assigned_documents
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

CREATE POLICY "phase_assigned_documents_update" ON phase_assigned_documents
  FOR UPDATE 
  USING (
    phase_id IN (
      SELECT cp.id 
      FROM company_phases cp
      JOIN user_company_access uca ON uca.company_id = cp.company_id
      WHERE uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "phase_assigned_documents_delete" ON phase_assigned_documents
  FOR DELETE 
  USING (
    phase_id IN (
      SELECT cp.id 
      FROM company_phases cp
      JOIN user_company_access uca ON uca.company_id = cp.company_id
      WHERE uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "company_document_templates_select" ON company_document_templates
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "company_document_templates_insert" ON company_document_templates
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "company_document_templates_update" ON company_document_templates
  FOR UPDATE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "company_document_templates_delete" ON company_document_templates
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
ALTER TABLE phase_assigned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;

-- Final verification
SELECT 'RLS policies rebuilt successfully' as status;
