
-- Complete RLS Policy Cleanup and Rebuild for Document Management
-- This migration removes all existing conflicting policies and creates fresh, consistent ones

-- Step 1: Remove ALL existing policies on phase_assigned_documents
DROP POLICY IF EXISTS "Users can view phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can insert phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can update phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can delete phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Enable read access for all users" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Enable update for users based on email" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON phase_assigned_documents;

-- Step 2: Remove ALL existing policies on company_document_templates (in case there are any old ones)
DROP POLICY IF EXISTS "Users can insert company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can view company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can update company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can delete company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON company_document_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON company_document_templates;
DROP POLICY IF EXISTS "Enable update for users based on email" ON company_document_templates;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON company_document_templates;

-- Step 3: Create fresh RLS policies for company_document_templates
CREATE POLICY "Users can view company document templates" ON company_document_templates
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert company document templates" ON company_document_templates
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update company document templates" ON company_document_templates
  FOR UPDATE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete company document templates" ON company_document_templates
  FOR DELETE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
      AND access_level = 'admin'
    )
  );

-- Step 4: Create fresh RLS policies for phase_assigned_documents
-- These policies check company access through the phases relationship
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

-- Step 5: Ensure RLS is enabled on both tables
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_assigned_documents ENABLE ROW LEVEL SECURITY;
