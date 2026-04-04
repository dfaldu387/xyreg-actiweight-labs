-- Broaden the update policy to allow any user with company access to update feedback (not just admins)
DROP POLICY IF EXISTS "Admins can update feedback for their companies" ON public.feedback_submissions;

CREATE POLICY "Company users can update feedback for their companies"
ON public.feedback_submissions
FOR UPDATE
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);