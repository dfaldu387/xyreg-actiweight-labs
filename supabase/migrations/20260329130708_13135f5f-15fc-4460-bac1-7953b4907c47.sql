
-- Vendor release management table
CREATE TABLE public.xyreg_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  release_date date NOT NULL,
  changelog text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE public.xyreg_releases ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read published releases
CREATE POLICY "Authenticated users can read published releases"
  ON public.xyreg_releases
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Super admins can manage all releases
CREATE POLICY "Super admins can manage releases"
  ON public.xyreg_releases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Seed current release
INSERT INTO public.xyreg_releases (version, release_date, changelog, status, published_at)
VALUES ('2.4.1', '2025-03-15', 'Initial tracked release', 'published', now());
