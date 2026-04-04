
-- Add ccr_id to bom_revisions (links a revision to its ECO/CCR)
ALTER TABLE public.bom_revisions
  ADD COLUMN ccr_id UUID NULL REFERENCES public.change_control_requests(id) ON DELETE SET NULL;

CREATE INDEX idx_bom_revisions_ccr_id ON public.bom_revisions(ccr_id) WHERE ccr_id IS NOT NULL;

-- Create bom_item_changes table for field-level audit trail
CREATE TABLE public.bom_item_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_revision_id UUID NOT NULL REFERENCES public.bom_revisions(id) ON DELETE CASCADE,
  bom_item_id UUID REFERENCES public.bom_items(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('added', 'modified', 'removed')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bom_item_changes_revision ON public.bom_item_changes(bom_revision_id);
CREATE INDEX idx_bom_item_changes_item ON public.bom_item_changes(bom_item_id) WHERE bom_item_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.bom_item_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies via user_company_access through bom_revisions
CREATE POLICY "Users can view BOM item changes for their company"
  ON public.bom_item_changes
  FOR SELECT
  TO authenticated
  USING (
    bom_revision_id IN (
      SELECT id FROM public.bom_revisions
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create BOM item changes for their company"
  ON public.bom_item_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bom_revision_id IN (
      SELECT id FROM public.bom_revisions
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );
