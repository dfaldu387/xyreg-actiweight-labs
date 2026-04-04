
-- Fix RLS Policy Issues for CSV Import
-- This migration fixes the broken INSERT policies that have qual: <nil>

-- Step 1: Fix phase_assigned_documents INSERT Policy
DROP POLICY IF EXISTS "Users can insert phase assigned documents" ON phase_assigned_documents;

CREATE POLICY "Users can insert phase assigned documents" ON phase_assigned_documents
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

-- Step 2: Fix company_document_templates INSERT Policy  
DROP POLICY IF EXISTS "Users can insert company document templates" ON company_document_templates;

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

-- Step 3: Ensure proper SELECT policies exist for both tables
-- These should already exist but let's make sure they're correct

DROP POLICY IF EXISTS "Users can view phase assigned documents" ON phase_assigned_documents;
CREATE POLICY "Users can view phase assigned documents" ON phase_assigned_documents
  FOR SELECT 
  USING (
    phase_id IN (
      SELECT cp.id 
      FROM company_phases cp
      JOIN user_company_access uca ON uca.company_id = cp.company_id
      WHERE uca.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view company document templates" ON company_document_templates;
CREATE POLICY "Users can view company document templates" ON company_document_templates
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

-- Step 4: Ensure both tables have RLS enabled
ALTER TABLE phase_assigned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;
