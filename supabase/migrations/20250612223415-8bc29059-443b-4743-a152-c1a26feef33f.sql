
-- Fix the companies table RLS policy to allow authenticated users to create companies
-- This resolves the bootstrap problem where new users can't create their first company

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Only admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admin users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can insert companies" ON companies;

-- Create a new INSERT policy that allows authenticated users to create companies
CREATE POLICY "Authenticated users can create companies" ON companies
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure the existing SELECT and UPDATE policies remain for proper access control
-- Users should only see/modify companies they have access to via user_company_access
CREATE POLICY "Users can view accessible companies" ON companies
  FOR SELECT 
  USING (
    id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their companies" ON companies
  FOR UPDATE 
  USING (
    id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level = 'admin'
    )
  );

CREATE POLICY "Admins can delete their companies" ON companies
  FOR DELETE 
  USING (
    id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level = 'admin'
    )
  );

-- Ensure user_company_access allows users to grant themselves admin access to companies they create
-- This works with the handle_new_company trigger
CREATE POLICY "Users can manage their company access" ON user_company_access
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Update the handle_new_company function to ensure it grants admin access to the creator
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  category_id uuid;
  existing_trigger_count integer;
BEGIN
  -- Prevent duplicate execution by checking if phases already exist
  SELECT COUNT(*) INTO existing_trigger_count
  FROM phases 
  WHERE company_id = NEW.id 
  AND is_predefined_core_phase = true;
  
  IF existing_trigger_count > 0 THEN
    RAISE NOTICE 'Company % already has % phases, skipping trigger execution', NEW.id, existing_trigger_count;
    RETURN NEW;
  END IF;
  
  -- Grant admin access to the user who created the company
  INSERT INTO user_company_access (
    user_id,
    company_id,
    access_level,
    is_primary,
    is_internal
  ) VALUES (
    auth.uid(),
    NEW.id,
    'admin',
    true,
    true
  )
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    access_level = 'admin',
    is_primary = true,
    is_internal = true;
  
  -- Ensure detailed design category exists
  SELECT public.ensure_detailed_design_category(NEW.id) INTO category_id;
  
  -- Use the safe phase creation function
  PERFORM public.ensure_standard_phases_for_company_safe(NEW.id, category_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the company creation
    RAISE WARNING 'Error in handle_new_company for company %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
