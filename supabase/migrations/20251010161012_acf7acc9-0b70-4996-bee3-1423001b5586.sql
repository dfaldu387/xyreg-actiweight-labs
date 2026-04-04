-- Add RLS policy to allow super admins to delete subscription plans
CREATE POLICY "Super admins can delete subscription plans"
  ON subscription_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );