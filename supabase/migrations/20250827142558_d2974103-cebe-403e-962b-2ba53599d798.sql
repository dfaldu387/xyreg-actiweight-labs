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