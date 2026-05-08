-- Storage bucket for global Work Instruction master images.
-- These images are uploaded ONCE by super-admins at the global SSOT layer
-- and inherited by every company that materializes the WI.
INSERT INTO storage.buckets (id, name, public)
VALUES ('wi-master-images', 'wi-master-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (images are embedded in WI documents).
DROP POLICY IF EXISTS "wi_master_images_public_read" ON storage.objects;
CREATE POLICY "wi_master_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'wi-master-images');

-- Only super-admins can write/update/delete.
DROP POLICY IF EXISTS "wi_master_images_super_admin_write" ON storage.objects;
CREATE POLICY "wi_master_images_super_admin_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wi-master-images'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
);

DROP POLICY IF EXISTS "wi_master_images_super_admin_update" ON storage.objects;
CREATE POLICY "wi_master_images_super_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wi-master-images'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
);

DROP POLICY IF EXISTS "wi_master_images_super_admin_delete" ON storage.objects;
CREATE POLICY "wi_master_images_super_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wi-master-images'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
);

-- Allow super-admins to update global_work_instructions.sections directly
-- (master content authoring). Existing read policy stays untouched.
DROP POLICY IF EXISTS "global_wi_super_admin_update" ON public.global_work_instructions;
CREATE POLICY "global_wi_super_admin_update"
ON public.global_work_instructions FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);
