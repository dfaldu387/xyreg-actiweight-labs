
-- Fix the RLS policy for company_document_templates to allow proper UPSERT operations
-- PostgreSQL doesn't allow both USING and WITH CHECK in INSERT policies
-- We need to structure this differently

-- First, drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Users can insert company document templates" ON company_document_templates;

-- Create a new INSERT policy with only WITH CHECK (this is correct for INSERT)
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

-- Ensure we have proper SELECT policy for the table
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

-- Ensure we have proper UPDATE policy for the table
DROP POLICY IF EXISTS "Users can update company document templates" ON company_document_templates;
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

-- Enable RLS on the table if not already enabled
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;
