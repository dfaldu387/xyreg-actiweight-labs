-- Inline section content for master templates (Doc Studio shape).
-- Optional: legacy file-only templates keep `sections` NULL.
ALTER TABLE public.default_document_templates
  ADD COLUMN IF NOT EXISTS sections jsonb;

-- Enable RLS if not already (idempotent).
ALTER TABLE public.default_document_templates ENABLE ROW LEVEL SECURITY;

-- Super-admin update policy (covers the new sections column and existing fields).
DROP POLICY IF EXISTS "default_document_templates_super_admin_update"
  ON public.default_document_templates;
CREATE POLICY "default_document_templates_super_admin_update"
ON public.default_document_templates FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);
