-- Fix RLS policies for company_api_keys table to allow edge functions to access the data

-- First, check if RLS is enabled and what policies exist
-- We need to allow service role (used by edge functions) to access this table

-- Create a policy that allows service role to read company API keys
CREATE POLICY "Allow service role to read company API keys" 
ON company_api_keys 
FOR SELECT 
USING (true);

-- Also ensure authenticated users can read their own company's API keys
CREATE POLICY "Users can read their company API keys" 
ON company_api_keys 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = company_api_keys.company_id 
    AND companies.id = (
      SELECT company_id FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    )
  )
);