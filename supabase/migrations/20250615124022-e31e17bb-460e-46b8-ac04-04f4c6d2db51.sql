
-- Complete RLS Policy Reset - Aggressive Cleanup to Fix Persistent Issues
-- This migration will completely reset RLS policies to eliminate all conflicts

BEGIN;

-- Step 1: Temporarily disable RLS to allow complete cleanup
ALTER TABLE company_document_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE phase_assigned_documents DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies with CASCADE to ensure complete removal
-- This removes any hidden, system, or duplicate policies that may exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on company_document_templates
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'company_document_templates'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON company_document_templates CASCADE', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on phase_assigned_documents
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'phase_assigned_documents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON phase_assigned_documents CASCADE', policy_record.policyname);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_assigned_documents ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONLY the clean, non-conflicting policies

-- Company Document Templates Policies
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
  )
  WITH CHECK (
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
      AND access_level = 'admin'
    )
  );

-- Phase Assigned Documents Policies
CREATE POLICY "phase_assigned_documents_select" ON phase_assigned_documents
  FOR SELECT 
  USING (
    phase_id IN (
      SELECT p.id 
      FROM phases p
      JOIN user_company_access uca ON uca.company_id = p.company_id
      WHERE uca.user_id = auth.uid()
    )
  );

CREATE POLICY "phase_assigned_documents_insert" ON phase_assigned_documents
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

CREATE POLICY "phase_assigned_documents_update" ON phase_assigned_documents
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

CREATE POLICY "phase_assigned_documents_delete" ON phase_assigned_documents
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

-- Step 5: Verification queries to ensure no duplicates
DO $$
DECLARE
    template_policy_count INTEGER;
    assigned_policy_count INTEGER;
BEGIN
    -- Count policies on each table
    SELECT COUNT(*) INTO template_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'company_document_templates';
    
    SELECT COUNT(*) INTO assigned_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'phase_assigned_documents';
    
    -- Log the counts
    RAISE NOTICE 'company_document_templates has % policies', template_policy_count;
    RAISE NOTICE 'phase_assigned_documents has % policies', assigned_policy_count;
    
    -- Ensure we have exactly the expected number of policies
    IF template_policy_count != 4 THEN
        RAISE EXCEPTION 'Expected 4 policies on company_document_templates, found %', template_policy_count;
    END IF;
    
    IF assigned_policy_count != 4 THEN
        RAISE EXCEPTION 'Expected 4 policies on phase_assigned_documents, found %', assigned_policy_count;
    END IF;
END $$;

COMMIT;
