-- Add missing SELECT policy for company_chosen_phases table
CREATE POLICY "company_chosen_phases_select" 
ON "public"."company_chosen_phases" 
AS PERMISSIVE 
FOR SELECT 
TO public 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE (user_company_access.user_id = auth.uid())
  )
);