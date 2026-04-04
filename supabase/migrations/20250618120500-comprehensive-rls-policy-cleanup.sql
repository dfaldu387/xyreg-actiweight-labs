
-- Comprehensive RLS Policy Cleanup for CSV Import
-- Remove all broken policies and create clean, working ones

-- Step 1: Drop ALL existing policies on both tables to start fresh
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

-- Step 2: Create clean, working policies for phase_assigned_documents
-- These policies reference company_phases (NOT the old phases table)
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

-- Step 3: Create clean, working policies for company_document_templates
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

-- Step 4: Ensure RLS is enabled on both tables
ALTER TABLE phase_assigned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;

-- Step 5: Verification
SELECT 'RLS policies completely rebuilt for CSV import' as status;
