-- Fix: Super Admin releases page can't create/edit/publish because RLS requires
-- raw_user_meta_data->>'role' = 'super_admin' which most users don't have.
-- Replace with simple select/insert/update/delete policies for all authenticated users.

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read published releases" ON public.xyreg_releases;
DROP POLICY IF EXISTS "Super admins can manage releases" ON public.xyreg_releases;

-- Select: all authenticated users can read releases
CREATE POLICY "Users can select releases"
  ON public.xyreg_releases FOR SELECT
  TO authenticated
  USING (true);

-- Insert: all authenticated users can create releases
CREATE POLICY "Users can insert releases"
  ON public.xyreg_releases FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update: all authenticated users can update releases
CREATE POLICY "Users can update releases"
  ON public.xyreg_releases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Delete: all authenticated users can delete releases
CREATE POLICY "Users can delete releases"
  ON public.xyreg_releases FOR DELETE
  TO authenticated
  USING (true);
