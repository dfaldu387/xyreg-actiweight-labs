
-- Fix RLS policy conflicts for company_document_templates table
-- Remove conflicting policies and create a clean, consistent set

-- Drop all existing policies for company_document_templates
DROP POLICY IF EXISTS "Users can insert company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can view company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can update company document templates" ON company_document_templates;
DROP POLICY IF EXISTS "Users can delete company document templates" ON company_document_templates;

-- Create comprehensive RLS policies for company_document_templates

-- SELECT policy: Users can view templates for companies they have access to
CREATE POLICY "Users can view company document templates" ON company_document_templates
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT policy: Users can create templates for companies where they have admin/editor access
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

-- UPDATE policy: Users can update templates for companies where they have admin/editor access
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

-- DELETE policy: Users can delete templates for companies where they have admin access
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

-- Ensure RLS is enabled
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;
