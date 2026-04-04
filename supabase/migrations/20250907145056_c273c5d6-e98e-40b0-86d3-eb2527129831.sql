-- Debug: Let's check what access levels exist and create a simpler policy for testing
-- First, let's see what's in the user_company_access table
SELECT 
  uca.user_id,
  uca.company_id, 
  uca.access_level,
  c.name as company_name
FROM user_company_access uca
JOIN companies c ON c.id = uca.company_id
WHERE c.name = 'Genis'
LIMIT 5;

-- Let's also create a temporary policy that's less restrictive for debugging
DROP POLICY IF EXISTS "Users can update activity templates for their companies" ON activity_templates;
DROP POLICY IF EXISTS "Users can create activity templates for their companies" ON activity_templates;

-- Create simpler policies that allow any authenticated user with company access
CREATE POLICY "Users can create activity templates for their companies" 
ON activity_templates FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update activity templates for their companies" 
ON activity_templates FOR UPDATE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);