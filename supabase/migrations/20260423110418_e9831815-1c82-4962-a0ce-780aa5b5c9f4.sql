
CREATE TABLE public.demo_seed_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seed_id TEXT NOT NULL,
  company_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_demo_seed_registry_lookup ON public.demo_seed_registry (seed_id, company_id);
CREATE INDEX idx_demo_seed_registry_table ON public.demo_seed_registry (table_name);

ALTER TABLE public.demo_seed_registry ENABLE ROW LEVEL SECURITY;

-- Only super admins can read/write the registry
CREATE POLICY "super_admin_read_registry"
  ON public.demo_seed_registry
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "super_admin_insert_registry"
  ON public.demo_seed_registry
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "super_admin_delete_registry"
  ON public.demo_seed_registry
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
