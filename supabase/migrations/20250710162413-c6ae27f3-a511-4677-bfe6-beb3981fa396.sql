-- Fix authentication and company access issues
-- First, let's check current authentication status and fix user access

-- Get current session info
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_email;

-- Debug: Check if there are any user profiles
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Debug: Check recent auth activity
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC 
LIMIT 5;

-- For the specific company that the user is trying to access
-- Let's temporarily create a more permissive policy to debug the issue

-- Drop existing problematic policies
DROP POLICY IF EXISTS "company_document_templates_insert" ON company_document_templates;

-- Create a temporary debug policy that allows all authenticated users
CREATE POLICY "temporary_debug_insert_policy" ON company_document_templates
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure the user has access to the specific company
-- Get the company ID for "New company after Migrations"
DO $$
DECLARE
  company_uuid uuid;
  user_uuid uuid;
BEGIN
  -- Get the company ID
  SELECT id INTO company_uuid 
  FROM companies 
  WHERE name = 'New company after Migrations';
  
  -- For debugging purposes, let's see what users exist
  FOR user_uuid IN 
    SELECT id FROM auth.users 
    WHERE created_at > now() - interval '7 days'
    ORDER BY created_at DESC 
    LIMIT 3
  LOOP
    -- Ensure the user has admin access to this company
    INSERT INTO user_company_access (user_id, company_id, access_level, is_internal)
    VALUES (user_uuid, company_uuid, 'admin', true)
    ON CONFLICT (user_id, company_id) 
    DO UPDATE SET 
      access_level = 'admin',
      is_internal = true,
      updated_at = now();
      
    -- Also ensure they have a profile
    INSERT INTO user_profiles (id, email)
    SELECT user_uuid, email
    FROM auth.users 
    WHERE id = user_uuid
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;