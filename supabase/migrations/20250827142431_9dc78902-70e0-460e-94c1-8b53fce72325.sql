-- Add super admin RLS policy to document_audit_logs table to allow viewing all audit logs
CREATE POLICY "Super admins can view all audit logs" 
ON public.document_audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Also check if we have any audit log data to work with
-- Let's create some sample audit log entries for testing purposes
INSERT INTO public.document_audit_logs (
  document_id,
  user_id,
  company_id,
  action,
  action_details,
  ip_address,
  user_agent,
  metadata
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'superadmin@gmail.com' LIMIT 1),
  (SELECT id FROM companies LIMIT 1),
  'view',
  '{"document_type": "Standard"}',
  '192.168.1.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '{"test": "sample_audit_log"}'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'superadmin@gmail.com' LIMIT 1),
  (SELECT id FROM companies LIMIT 1),
  'edit',
  '{"document_type": "Regulatory"}',
  '192.168.1.100',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  '{"test": "sample_audit_log_2"}'
);

-- Ensure there are companies in the database for the sample data
INSERT INTO public.companies (name, description) 
SELECT 'Sample Company', 'A test company for audit log demonstration'
WHERE NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1);