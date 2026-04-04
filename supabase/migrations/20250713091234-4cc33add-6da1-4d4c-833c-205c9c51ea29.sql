-- Allow updating template scope
-- RLS policy update to allow scope modifications for company templates
CREATE POLICY "Company admins can update template scope" ON gap_analysis_templates
FOR UPDATE USING (
  company_id IS NOT NULL AND 
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level = 'admin'
  )
) WITH CHECK (
  company_id IS NOT NULL AND 
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level = 'admin'
  )
);