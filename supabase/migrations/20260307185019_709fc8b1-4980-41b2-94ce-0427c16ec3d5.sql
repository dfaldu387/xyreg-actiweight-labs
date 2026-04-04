-- Add soft-delete columns to bom_revisions (matching products/companies pattern)
ALTER TABLE public.bom_revisions
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID;